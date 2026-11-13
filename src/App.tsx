import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navigation } from './components/Navigation';
import { ConnectView } from './components/ConnectView';
import { ServersView } from './components/ServersView';
import { ToolsView } from './components/ToolsView';
import { ApkExportView } from './components/ApkExportView';
import { OfflineIndicator } from './components/OfflineIndicator';
import type {
  NetworkInspection,
  TelemetryPoint,
  TunnelSession,
  VpnKeypair,
  VpnServer,
  VpnSettings,
  VpnTab,
} from './types';

function KestrelVpnApp() {
  const [activeTab, setActiveTab] = useState<VpnTab>('connect');
  const [servers, setServers] = useState<VpnServer[]>([]);
  const [keypair, setKeypair] = useState<VpnKeypair | null>(null);
  const [settings, setSettings] = useState<VpnSettings | null>(null);
  const [session, setSession] = useState<TunnelSession | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [networkInfo, setNetworkInfo] = useState<NetworkInspection | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [probingLatency, setProbingLatency] = useState(false);
  const [lastProbeLive, setLastProbeLive] = useState<boolean | null>(null);
  const [regeneratingKeys, setRegeneratingKeys] = useState(false);

  const loadState = useCallback(async () => {
    try {
      const [stateRes, netRes] = await Promise.all([
        fetch('/api/vpn/state'),
        fetch('/api/network/inspect'),
      ]);
      if (!stateRes.ok) {
        throw new Error('Impossible de charger la configuration VPN.');
      }
      const data = await stateRes.json();
      setServers(data.servers || []);
      setKeypair(data.keypair || null);
      setSettings(data.settings || null);
      setSession(data.session || null);
      setTelemetryHistory(data.telemetryHistory || []);

      if (netRes.ok) {
        setNetworkInfo((await netRes.json()) as NetworkInspection);
      }
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Erreur de connexion au service local.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Poll live telemetry when tunnel is active
  useEffect(() => {
    if (!session?.connected) return;
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch('/api/vpn/telemetry');
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        if (data.session) setSession(data.session);
        if (data.telemetryHistory) setTelemetryHistory(data.telemetryHistory);
        if (typeof data.measuredLatencyMs === 'number' && data.session?.serverId) {
          setServers((prev) =>
            prev.map((srv) =>
              srv.id === data.session.serverId
                ? { ...srv, measuredLatencyMs: data.measuredLatencyMs }
                : srv
            )
          );
        }
      } catch {
        // silent retry on next tick
      }
    };

    const timer = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [session?.connected]);

  const activeServer = useMemo(() => {
    if (servers.length === 0) return null;
    return (
      servers.find((s) => s.id === settings?.selectedServerId) ||
      servers[0]
    );
  }, [servers, settings?.selectedServerId]);

  const activeOperator = useMemo(() => {
    if (!activeServer) return '';
    if (settings?.selectedOperator && activeServer.operators.includes(settings.selectedOperator)) {
      return settings.selectedOperator;
    }
    return activeServer.operators[0] || '';
  }, [activeServer, settings?.selectedOperator]);

  const handleToggleConnect = async () => {
    if (!session || !settings || connecting) return;
    setConnecting(true);
    try {
      if (session.connected) {
        const res = await fetch('/api/vpn/disconnect', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      } else {
        const res = await fetch('/api/vpn/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverId: settings.selectedServerId,
            operator: activeOperator,
            protocol: settings.protocol,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
          setSettings(data.settings);
        }
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<VpnSettings>) => {
    if (!settings) return;
    const optimistic = { ...settings, ...updates };
    setSettings(optimistic);

    const res = await fetch('/api/vpn/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      if (data.session) setSession(data.session);
    }
  };

  const handleSelectOperator = async (operator: string) => {
    await handleUpdateSettings({ selectedOperator: operator });
  };

  const handleSelectAndConnect = async (serverId: string, operator?: string) => {
    if (!settings) return;
    const targetSrv = servers.find((s) => s.id === serverId);
    const chosenOperator = operator || targetSrv?.operators[0] || settings.selectedOperator;

    setConnecting(true);
    try {
      const res = await fetch('/api/vpn/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId,
          operator: chosenOperator,
          protocol: settings.protocol,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setSettings(data.settings);
        setActiveTab('connect');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleRunLatencyProbe = async () => {
    setProbingLatency(true);
    try {
      const res = await fetch('/api/network/ping', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
        setLastProbeLive(Boolean(data.liveProbeSucceeded));
      }
    } finally {
      setProbingLatency(false);
    }
  };

  const handleRegenerateKeys = async () => {
    setRegeneratingKeys(true);
    try {
      const res = await fetch('/api/vpn/keys/regenerate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setKeypair(data.keypair);
      }
    } finally {
      setRegeneratingKeys(false);
    }
  };

  const handleRefreshNetwork = async () => {
    const res = await fetch('/api/network/inspect');
    if (res.ok) {
      setNetworkInfo((await res.json()) as NetworkInspection);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <Navigation
        activeTab={activeTab}
        connected={Boolean(session?.connected)}
        onSelectTab={setActiveTab}
      />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
        {loading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Chargement de Kestrel VPN">
            <div className="h-8 w-52 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 lg:col-span-7" />
              <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 lg:col-span-5" />
            </div>
          </div>
        ) : errorMessage || !activeServer || !settings || !session || !keypair ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center dark:border-red-900/40 dark:bg-slate-900">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              {errorMessage || 'État VPN indisponible.'}
            </p>
            <button
              type="button"
              onClick={loadState}
              className="mt-4 min-h-[44px] rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'connect' && (
              <ConnectView
                servers={servers}
                activeServer={activeServer}
                settings={settings}
                session={session}
                telemetryHistory={telemetryHistory}
                networkInfo={networkInfo}
                connecting={connecting}
                onToggleConnect={handleToggleConnect}
                onUpdateSettings={handleUpdateSettings}
                onSelectOperator={handleSelectOperator}
                onNavigate={setActiveTab}
                onRefreshNetwork={handleRefreshNetwork}
              />
            )}

            {activeTab === 'servers' && (
              <ServersView
                servers={servers}
                selectedServerId={settings.selectedServerId}
                selectedOperator={activeOperator}
                session={session}
                probingLatency={probingLatency}
                lastProbeLive={lastProbeLive}
                onSelectAndConnect={handleSelectAndConnect}
                onRunLatencyProbe={handleRunLatencyProbe}
              />
            )}

            {activeTab === 'tools' && (
              <ToolsView
                keypair={keypair}
                settings={settings}
                regeneratingKeys={regeneratingKeys}
                onRegenerateKeys={handleRegenerateKeys}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {activeTab === 'apk' && (
              <ApkExportView
                servers={servers}
                activeServer={activeServer}
                activeOperator={activeOperator}
                keypair={keypair}
                settings={settings}
              />
            )}
          </>
        )}
      </main>

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <KestrelVpnApp />
    </ThemeProvider>
  );
}

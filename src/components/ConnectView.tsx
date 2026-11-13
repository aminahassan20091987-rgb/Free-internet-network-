import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Infinity as InfinityIcon,
  Lock,
  Monitor,
  Moon,
  Power,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Sun,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { LogoImage } from './LogoImage';
import { getCountryLogoUrl, getOperatorLogoUrl } from '../utils/logoPaths';
import {
  DNS_PROVIDERS,
  PROTOCOL_INFO,
  formatBytes,
  formatDuration,
} from '../utils/vpnConfig';
import type {
  NetworkInspection,
  TelemetryPoint,
  TunnelSession,
  VpnProtocol,
  VpnServer,
  VpnSettings,
  VpnTab,
} from '../types';

interface ConnectViewProps {
  servers: VpnServer[];
  activeServer: VpnServer;
  settings: VpnSettings;
  session: TunnelSession;
  telemetryHistory: TelemetryPoint[];
  networkInfo: NetworkInspection | null;
  connecting: boolean;
  onToggleConnect: () => Promise<void>;
  onUpdateSettings: (updates: Partial<VpnSettings>) => Promise<void>;
  onSelectOperator: (operator: string) => Promise<void>;
  onNavigate: (tab: VpnTab) => void;
  onRefreshNetwork: () => Promise<void>;
}

interface WebRtcLeakStatus {
  checked: boolean;
  checking: boolean;
  candidates: string[];
  hasLocalLeak: boolean;
  error?: string;
}

export const ConnectView: React.FC<ConnectViewProps> = ({
  activeServer,
  settings,
  session,
  telemetryHistory,
  networkInfo,
  connecting,
  onToggleConnect,
  onUpdateSettings,
  onSelectOperator,
  onNavigate,
  onRefreshNetwork,
}) => {
  const { theme, setTheme } = useTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [webrtcStatus, setWebrtcStatus] = useState<WebRtcLeakStatus>({
    checked: false,
    checking: false,
    candidates: [],
    hasLocalLeak: false,
  });

  useEffect(() => {
    if (!session.connected || !session.connectedAt) {
      setElapsedSeconds(0);
      return;
    }
    const updateTimer = () => {
      const start = new Date(session.connectedAt!).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [session.connected, session.connectedAt]);

  const runWebRtcCheck = async () => {
    if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
      setWebrtcStatus({
        checked: true,
        checking: false,
        candidates: [],
        hasLocalLeak: false,
        error: 'WebRTC non disponible dans ce navigateur.',
      });
      return;
    }

    setWebrtcStatus({ checked: false, checking: true, candidates: [], hasLocalLeak: false });
    const found = new Set<string>();

    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('kestrel-probe');

      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 1800);
        pc.onicecandidate = (evt) => {
          if (!evt.candidate) {
            window.clearTimeout(timeout);
            resolve();
            return;
          }
          const match = evt.candidate.candidate.match(
            /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9:]+:+[a-f0-9:]+)/i
          );
          if (match && match[1]) {
            found.add(match[1]);
          }
        };
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .catch(() => {
            window.clearTimeout(timeout);
            resolve();
          });
      });

      pc.close();
      const list = Array.from(found);
      const hasLocalLeak = list.some(
        (ip) =>
          ip.startsWith('192.168.') ||
          ip.startsWith('10.') ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
      );

      setWebrtcStatus({
        checked: true,
        checking: false,
        candidates: list,
        hasLocalLeak,
      });
    } catch {
      setWebrtcStatus({
        checked: true,
        checking: false,
        candidates: [],
        hasLocalLeak: false,
        error: 'Sonde WebRTC bloquée par la politique du navigateur.',
      });
    }
  };

  const activeLatency = activeServer.measuredLatencyMs ?? activeServer.baseLatencyMs;
  const protoMeta = PROTOCOL_INFO[settings.protocol];
  const latestTelemetry = telemetryHistory[telemetryHistory.length - 1];
  const activeOperator = activeServer.operators.includes(settings.selectedOperator)
    ? settings.selectedOperator
    : activeServer.operators[0];

  return (
    <div className="space-y-6">
      {/* Main 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Focal Anchor: Tunnel Connection & Unlimited GB African Carrier Status */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tunnel mobile · Données Go illimitées
                </p>
                <div className="mt-1 flex items-center gap-2.5">
                  {session.connected ? (
                    <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  ) : (
                    <ShieldOff className="h-6 w-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                  )}
                  <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {session.connected ? 'Tunnel chiffré actif' : 'Protection en veille'}
                  </h1>
                </div>
              </div>

              <div className="text-right font-mono tabular-nums">
                <p className="text-xs text-slate-500 dark:text-slate-400">Durée · Quota</p>
                <p className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatDuration(elapsedSeconds)} · ∞ Go
                </p>
              </div>
            </div>

            {/* Central Tactile Connect Control */}
            <div className="my-7 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={onToggleConnect}
                disabled={connecting}
                aria-pressed={session.connected}
                className={`group relative flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 transition-all duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${
                  session.connected
                    ? 'border-emerald-500/30 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
                    : 'border-blue-600/20 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                }`}
              >
                <Power className="h-9 w-9 transition-transform duration-200 group-hover:scale-105" aria-hidden="true" />
                <span className="mt-2 text-sm font-semibold whitespace-nowrap">
                  {connecting
                    ? 'Négociation…'
                    : session.connected
                      ? 'Déconnecter'
                      : 'Se connecter'}
                </span>
              </button>

              <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                <span>{protoMeta.label}</span>
                <span aria-hidden="true" className="mx-2">·</span>
                <span>{protoMeta.cipher}</span>
                <span aria-hidden="true" className="mx-2">·</span>
                <span className="font-mono tabular-nums">IP {activeServer.gatewayIp}</span>
              </p>
            </div>
          </div>

          {/* Active African Country + Calling Code + Operator Switcher + 3-Metric Strip */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => onNavigate('servers')}
                className="flex min-h-[48px] w-full items-center justify-between gap-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <LogoImage
                    src={getCountryLogoUrl(activeServer.countryCode)}
                    alt={`Drapeau ${activeServer.country}`}
                    fallbackText={activeServer.countryCode}
                    className="h-9 w-13 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Pays & opérateur actif (54 pays africains)
                    </p>
                    <p className="mt-0.5 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                      {activeServer.country} ({activeServer.dialCode}) · {activeOperator}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{activeServer.gatewayIp}:{activeServer.wgPort}</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span>Go illimités</span>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span>Charge {activeServer.loadPct}%</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <span className="font-mono text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                    {latestTelemetry?.latencyMs ?? activeLatency} ms
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
              </button>

              {/* Quick Operator Selector with PNG Logos */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-3 dark:border-slate-800">
                {activeServer.operators.map((op) => {
                  const selected = op === activeOperator;
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => onSelectOperator(op)}
                      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <LogoImage
                        src={getOperatorLogoUrl(op)}
                        alt={`Logo ${op}`}
                        fallbackText={op.slice(0, 2).toUpperCase()}
                        className="h-4 w-4 shrink-0 rounded object-cover"
                      />
                      <span>{op}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unboxed 3-Metric Hairline Strip */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 pt-4 dark:divide-slate-800 dark:border-slate-800">
              <div className="pr-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Réception</span>
                </div>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {session.connected ? `${session.currentDownMbps.toFixed(1)} Mbps` : '0.0 Mbps'}
                </p>
                <p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {formatBytes(session.bytesRx)}
                </p>
              </div>

              <div className="px-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>Émission</span>
                </div>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {session.connected ? `${session.currentUpMbps.toFixed(1)} Mbps` : '0.0 Mbps'}
                </p>
                <p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {formatBytes(session.bytesTx)}
                </p>
              </div>

              <div className="pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Lock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                  <span>Quota & IP</span>
                </div>
                <p className="mt-1 flex items-center gap-1 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  <InfinityIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Illimité</span>
                </p>
                <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                  {session.connected ? session.virtualIp : activeServer.gatewayIp}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Protocol, Security Controls & Network Identity */}
        <section className="flex flex-col justify-between gap-6 lg:col-span-5">
          {/* Protocol & Quick Protections Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Protocole & Sécurité
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('apk')}
                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400 whitespace-nowrap"
              >
                Exporter .conf / APK
              </button>
            </div>

            {/* Interactive Protocol Segmented Control */}
            <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
              {(Object.keys(PROTOCOL_INFO) as VpnProtocol[]).map((proto) => {
                const active = settings.protocol === proto;
                return (
                  <button
                    key={proto}
                    type="button"
                    onClick={() => onUpdateSettings({ protocol: proto })}
                    className={`min-h-[40px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    {PROTOCOL_INFO[proto].label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {protoMeta.summary}
            </p>

            {/* Hairline Toggle Rows */}
            <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Kill Switch Universel
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bloque tout trafic si le tunnel coupe
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.killSwitch}
                  onChange={(e) => onUpdateSettings({ killSwitch: e.target.checked })}
                  className="h-5 w-5 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Split Tunneling Android
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {settings.excludedApps.length} application(s) exclue(s) dans Outils
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.splitTunnelingEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ splitTunnelingEnabled: e.target.checked })
                  }
                  className="h-5 w-5 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Auto-connexion Wi-Fi & 4G/5G
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Maintient le tunnel actif lors des changements réseau
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoConnectUntrustedWifi}
                  onChange={(e) =>
                    onUpdateSettings({ autoConnectUntrustedWifi: e.target.checked })
                  }
                  className="h-5 w-5 accent-blue-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* DNS Selector */}
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <label
                htmlFor="dns-select"
                className="block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Résolveur DNS Chiffré
              </label>
              <select
                id="dns-select"
                value={settings.dnsProvider}
                onChange={(e) =>
                  onUpdateSettings({ dnsProvider: e.target.value as VpnSettings['dnsProvider'] })
                }
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {DNS_PROVIDERS.map((dns) => (
                  <option key={dns.id} value={dns.id}>
                    {dns.label} ({dns.servers})
                  </option>
                ))}
              </select>
              {settings.dnsProvider === 'custom' && (
                <input
                  type="text"
                  value={settings.customDns}
                  onChange={(e) => onUpdateSettings({ customDns: e.target.value })}
                  placeholder="Ex: 1.1.1.1, 9.9.9.9"
                  aria-label="Adresse DNS personnalisée"
                  className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              )}
            </div>
          </div>

          {/* Real Network Identity & Theme Switch Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Identité Réseau & Apparence
              </h2>
              <button
                type="button"
                onClick={onRefreshNetwork}
                aria-label="Actualiser la détection IP"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">IP détectée</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {networkInfo?.publicIp || networkInfo?.clientIp || 'Détection…'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">IP Passerelle VPN</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {activeServer.gatewayIp}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">Fuite WebRTC</span>
                <button
                  type="button"
                  onClick={runWebRtcCheck}
                  disabled={webrtcStatus.checking}
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {webrtcStatus.checking
                    ? 'Analyse…'
                    : webrtcStatus.checked
                      ? webrtcStatus.hasLocalLeak
                        ? `${webrtcStatus.candidates.length} IP locales exposées`
                        : 'Aucune fuite locale'
                      : 'Vérifier maintenant'}
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Thème d’affichage
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
                {(
                  [
                    { id: 'light', label: 'Clair', icon: Sun },
                    { id: 'dark', label: 'Sombre', icon: Moon },
                    { id: 'system', label: 'Auto', icon: Monitor },
                  ] as const
                ).map((mode) => {
                  const Icon = mode.icon;
                  const active = theme === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTheme(mode.id)}
                      className={`flex min-h-[34px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

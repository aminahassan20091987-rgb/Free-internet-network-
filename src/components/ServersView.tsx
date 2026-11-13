import React, { useMemo, useState } from 'react';
import { Activity, Check, Search } from 'lucide-react';
import { LogoImage } from './LogoImage';
import { getCountryLogoUrl, getOperatorLogoUrl } from '../utils/logoPaths';
import type { AfricanRegion, TunnelSession, VpnServer } from '../types';

interface ServersViewProps {
  servers: VpnServer[];
  selectedServerId: string;
  selectedOperator: string;
  session: TunnelSession;
  probingLatency: boolean;
  lastProbeLive: boolean | null;
  onSelectAndConnect: (serverId: string, operator?: string) => Promise<void>;
  onRunLatencyProbe: () => Promise<void>;
}

type ServerFilter = 'all' | AfricanRegion;

const FILTER_TABS: { id: ServerFilter; label: string }[] = [
  { id: 'all', label: 'Tous (54)' },
  { id: 'Afrique de l\'Ouest', label: 'Afrique de l’Ouest' },
  { id: 'Afrique Centrale', label: 'Afrique Centrale' },
  { id: 'Afrique du Nord', label: 'Afrique du Nord' },
  { id: 'Afrique de l\'Est', label: 'Afrique de l’Est' },
  { id: 'Afrique Australe', label: 'Afrique Australe' },
];

export const ServersView: React.FC<ServersViewProps> = ({
  servers,
  selectedServerId,
  selectedOperator,
  session,
  probingLatency,
  lastProbeLive,
  onSelectAndConnect,
  onRunLatencyProbe,
}) => {
  const [filter, setFilter] = useState<ServerFilter>('all');
  const [query, setQuery] = useState('');
  const [sortByLatency, setSortByLatency] = useState(false);

  const filteredServers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = servers.filter((srv) => {
      if (filter !== 'all' && srv.region !== filter) return false;

      if (!q) return true;
      return (
        srv.country.toLowerCase().includes(q) ||
        srv.dialCode.toLowerCase().includes(q) ||
        srv.countryCode.toLowerCase().includes(q) ||
        srv.gatewayIp.includes(q) ||
        srv.operators.some((op) => op.toLowerCase().includes(q))
      );
    });

    if (sortByLatency) {
      return [...list].sort((a, b) => {
        const latA = a.measuredLatencyMs ?? a.baseLatencyMs;
        const latB = b.measuredLatencyMs ?? b.baseLatencyMs;
        return latA - latB;
      });
    }
    return list;
  }, [servers, filter, query, sortByLatency]);

  return (
    <div className="space-y-6">
      {/* Header & Real Latency Benchmark Trigger */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            54 Pays Africains · Opérateurs & Go Illimités
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Sélectionnez un pays, son indicatif et votre opérateur mobile pour connecter le tunnel par IP passerelle dédiée sans limite de volume.
            {lastProbeLive === true && ' Latences mesurées en direct par sonde TCP.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onRunLatencyProbe}
          disabled={probingLatency}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <Activity className={`h-4 w-4 ${probingLatency ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{probingLatency ? 'Mesure TCP en cours…' : 'Tester la latence'}</span>
        </button>
      </div>

      {/* Search + Regional Interactive Filter Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pays, indicatif (+225, +221) ou opérateur (MTN, Orange, Vodacom)…"
              aria-label="Rechercher un pays ou opérateur africain"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            type="button"
            onClick={() => setSortByLatency((v) => !v)}
            className="min-h-[44px] self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 sm:self-auto"
          >
            {sortByLatency ? 'Tri : Latence la plus basse' : 'Tri : Ordre alphabétique'}
          </button>
        </div>
      </div>

      {/* African Country & Carrier List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {filteredServers.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Aucun pays ou opérateur ne correspond à votre recherche.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredServers.map((server) => {
              const isSelected = server.id === selectedServerId;
              const isConnectedHere = session.connected && session.serverId === server.id;
              const latency = server.measuredLatencyMs ?? server.baseLatencyMs;
              const latencyTone =
                latency < 45
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : latency < 130
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400';

              return (
                <div
                  key={server.id}
                  className={`flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
                    <LogoImage
                      src={getCountryLogoUrl(server.countryCode)}
                      alt={`Drapeau ${server.country}`}
                      fallbackText={server.countryCode}
                      className="h-9 w-13 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {server.country} ({server.dialCode})
                        </p>
                        {isConnectedHere && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Connecté ({session.operator})
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{server.region}</span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="font-mono">{server.gatewayIp}</span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span>Go illimité</span>
                      </p>

                      {/* Clickable Mobile Operator Buttons with PNG Logos */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {server.operators.map((op) => {
                          const isOpActive = isSelected && selectedOperator === op;
                          return (
                            <button
                              key={op}
                              type="button"
                              onClick={() => onSelectAndConnect(server.id, op)}
                              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                                isOpActive
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-blue-400'
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
                  </div>

                  <div className="flex items-center justify-between gap-4 pl-15 sm:justify-end sm:pl-0 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className={`font-mono text-sm font-semibold tabular-nums ${latencyTone}`}>
                        {latency} ms
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {server.measuredLatencyMs !== null ? 'Mesuré' : 'Estimé'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectAndConnect(server.id, server.operators[0])}
                      className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        isConnectedHere
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700'
                      }`}
                    >
                      {isConnectedHere ? 'Actif' : 'Connecter'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

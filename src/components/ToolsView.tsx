import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Plus, RefreshCw, Search } from 'lucide-react';
import { ANDROID_APPS_CATALOG } from '../utils/vpnConfig';
import type { DohResponse, VpnKeypair, VpnSettings } from '../types';

interface ToolsViewProps {
  keypair: VpnKeypair;
  settings: VpnSettings;
  regeneratingKeys: boolean;
  onRegenerateKeys: () => Promise<void>;
  onUpdateSettings: (updates: Partial<VpnSettings>) => Promise<void>;
}

export const ToolsView: React.FC<ToolsViewProps> = ({
  keypair,
  settings,
  regeneratingKeys,
  onRegenerateKeys,
  onUpdateSettings,
}) => {
  const [domain, setDomain] = useState('example.com');
  const [recordType, setRecordType] = useState('A');
  const [resolver, setResolver] = useState<'cloudflare' | 'google'>('cloudflare');
  const [dohLoading, setDohLoading] = useState(false);
  const [dohError, setDohError] = useState<string | null>(null);
  const [dohResult, setDohResult] = useState<DohResponse | null>(null);

  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customPackageInput, setCustomPackageInput] = useState('');

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard restriction
    }
  };

  const handleDohLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setDohLoading(true);
    setDohError(null);
    try {
      const res = await fetch('/api/network/doh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, recordType, resolver }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDohError(data.error || 'Échec de la requête DNS.');
        setDohResult(null);
      } else {
        setDohResult(data as DohResponse);
      }
    } catch {
      setDohError('Erreur réseau lors de la résolution DoH.');
    } finally {
      setDohLoading(false);
    }
  };

  const toggleExcludedApp = (pkg: string) => {
    const exists = settings.excludedApps.includes(pkg);
    const next = exists
      ? settings.excludedApps.filter((item) => item !== pkg)
      : [...settings.excludedApps, pkg];
    onUpdateSettings({ excludedApps: next });
  };

  const addCustomPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customPackageInput.trim();
    if (!cleaned || !/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/.test(cleaned)) return;
    if (!settings.excludedApps.includes(cleaned)) {
      onUpdateSettings({ excludedApps: [...settings.excludedApps, cleaned] });
    }
    setCustomPackageInput('');
  };

  const customPackages = settings.excludedApps.filter(
    (pkg) => !ANDROID_APPS_CATALOG.some((app) => app.packageName === pkg)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Outils Réseau & Cryptographie
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Résolveur DNS-over-HTTPS en direct, gestion de clés WireGuard Curve25519 et règles de Split Tunneling Android.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live DoH Resolver */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Testeur DNS Chiffré (DoH)
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Interroge réellement Cloudflare (1.1.1.1) ou Google DNS (8.8.8.8) en HTTPS chiffré.
          </p>

          <form onSubmit={handleDohLookup} className="mt-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="ex: wikipedia.org"
                aria-label="Nom de domaine à résoudre"
                className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                aria-label="Type d’enregistrement DNS"
                className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="A">A</option>
                <option value="AAAA">AAAA</option>
                <option value="MX">MX</option>
                <option value="TXT">TXT</option>
                <option value="CNAME">CNAME</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setResolver('cloudflare')}
                  className={`min-h-[36px] rounded-md px-3 text-xs font-medium transition-colors ${
                    resolver === 'cloudflare'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Cloudflare 1.1.1.1
                </button>
                <button
                  type="button"
                  onClick={() => setResolver('google')}
                  className={`min-h-[36px] rounded-md px-3 text-xs font-medium transition-colors ${
                    resolver === 'google'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Google 8.8.8.8
                </button>
              </div>

              <button
                type="submit"
                disabled={dohLoading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 whitespace-nowrap"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>{dohLoading ? 'Résolution…' : 'Résoudre'}</span>
              </button>
            </div>
          </form>

          {dohError && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {dohError}
            </p>
          )}

          {dohResult && (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {dohResult.resolver} · {dohResult.recordType}
                </span>
                <span className="font-mono tabular-nums">{dohResult.elapsedMs} ms</span>
              </div>

              {dohResult.answers.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Aucun enregistrement {dohResult.recordType} trouvé pour {dohResult.domain}.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                  {dohResult.answers.map((ans, idx) => (
                    <div key={`${ans.data}-${idx}`} className="flex items-center justify-between gap-3 py-2 text-xs">
                      <span className="truncate font-mono text-slate-900 dark:text-slate-100">
                        {ans.data}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                        TTL {ans.TTL}s
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Real Curve25519 Keypair Manager */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Clés WireGuard Curve25519
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Paire cryptographique X25519 générée côté serveur (32 octets Base64).
              </p>
            </div>
            <button
              type="button"
              onClick={onRegenerateKeys}
              disabled={regeneratingKeys}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${regeneratingKeys ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Régénérer</span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {/* Public Key */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                  Clé publique client
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('pub', keypair.publicKey)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                >
                  {copiedField === 'pub' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'pub' ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <p className="mt-1.5 break-all font-mono text-xs text-slate-900 dark:text-slate-100">
                {keypair.publicKey}
              </p>
            </div>

            {/* Private Key */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Clé privée client (confidentielle)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    {showPrivateKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showPrivateKey ? 'Masquer' : 'Afficher'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('priv', keypair.privateKey)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                  >
                    {copiedField === 'priv' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedField === 'priv' ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>
              <p className="mt-1.5 break-all font-mono text-xs text-slate-900 dark:text-slate-100">
                {showPrivateKey
                  ? keypair.privateKey
                  : '••••••••••••••••••••••••••••••••••••••••••••'}
              </p>
            </div>

            {/* Preshared Key */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Clé pré-partagée (PresharedKey)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('psk', keypair.presharedKey)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400"
                >
                  {copiedField === 'psk' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === 'psk' ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <p className="mt-1.5 break-all font-mono text-xs text-slate-900 dark:text-slate-100">
                {showPrivateKey
                  ? keypair.presharedKey
                  : '••••••••••••••••••••••••••••••••••••••••••••'}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Split Tunneling Android + MTU Tuning */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Split Tunneling Android & Paramètre MTU
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cochez les applications qui doivent contourner le tunnel VPN dans le profil .conf et l’APK Android.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label htmlFor="mtu-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              MTU tunnel
            </label>
            <select
              id="mtu-select"
              value={settings.mtu}
              onChange={(e) => onUpdateSettings({ mtu: Number(e.target.value) })}
              className="min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value={1420}>1420 (Standard Wi-Fi / 5G)</option>
              <option value={1380}>1380 (4G / Dual-Stack)</option>
              <option value={1280}>1280 (Réseaux restreints)</option>
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ANDROID_APPS_CATALOG.map((app) => {
            const excluded = settings.excludedApps.includes(app.packageName);
            return (
              <label
                key={app.packageName}
                className={`flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  excluded
                    ? 'border-blue-600/50 bg-blue-50/40 dark:border-blue-500/40 dark:bg-blue-950/20'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {app.label}
                  </p>
                  <p className="truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {app.packageName}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={excluded}
                  onChange={() => toggleExcludedApp(app.packageName)}
                  className="h-4 w-4 accent-blue-600 shrink-0"
                />
              </label>
            );
          })}
        </div>

        {customPackages.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {customPackages.map((pkg) => (
              <button
                key={pkg}
                type="button"
                onClick={() => toggleExcludedApp(pkg)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                <span>{pkg}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={addCustomPackage} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={customPackageInput}
            onChange={(e) => setCustomPackageInput(e.target.value)}
            placeholder="Ajouter un package Android (ex: com.sec.android.app.sbrowser)"
            aria-label="Nom du package Android personnalisé"
            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Exclure le package</span>
          </button>
        </form>
      </section>
    </div>
  );
};

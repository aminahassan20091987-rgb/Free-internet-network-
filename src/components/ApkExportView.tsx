import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, FileCode2, QrCode, Smartphone } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { LogoImage } from './LogoImage';
import { getCountryLogoUrl, getOperatorLogoUrl } from '../utils/logoPaths';
import { buildOpenVpnConfig, buildWireGuardConfig } from '../utils/vpnConfig';
import { generateUniversalAndroidProjectZip } from '../utils/androidProjectBuilder';
import type { VpnKeypair, VpnServer, VpnSettings } from '../types';

interface ApkExportViewProps {
  servers: VpnServer[];
  activeServer: VpnServer;
  activeOperator: string;
  keypair: VpnKeypair;
  settings: VpnSettings;
}

export const ApkExportView: React.FC<ApkExportViewProps> = ({
  servers,
  activeServer,
  activeOperator,
  keypair,
  settings,
}) => {
  const [configFormat, setConfigFormat] = useState<'wireguard' | 'openvpn'>('wireguard');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [buildingZip, setBuildingZip] = useState(false);

  const wireGuardText = useMemo(
    () => buildWireGuardConfig(activeServer, activeOperator, keypair, settings),
    [activeServer, activeOperator, keypair, settings]
  );

  const openVpnText = useMemo(
    () => buildOpenVpnConfig(activeServer, activeOperator, settings),
    [activeServer, activeOperator, settings]
  );

  const displayedConfig = configFormat === 'wireguard' ? wireGuardText : openVpnText;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(wireGuardText, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [wireGuardText]);

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(displayedConfig);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadConfig = () => {
    const ext = configFormat === 'wireguard' ? 'conf' : 'ovpn';
    const filename = `kestrel-${activeServer.id}.${ext}`;
    const blob = new Blob([displayedConfig], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadApkProject = async () => {
    setBuildingZip(true);
    try {
      const blob = await generateUniversalAndroidProjectZip(
        servers,
        activeServer,
        activeOperator,
        keypair,
        settings
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `kestrel-vpn-android-apk-universel.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setBuildingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Déploiement Mobile & Export APK Universel
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Installez l’application mobile, exportez le profil pour {activeServer.country} ({activeServer.dialCode}) · {activeOperator} ou téléchargez le projet APK universel complet.
        </p>
      </div>

      {/* Top Row: PWA Mobile Install + Universal Android APK Source Bundle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">
                1. Installation Mobile Directe (Android & iOS)
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Installez Kestrel VPN sur l’écran d’accueil de votre smartphone pour accéder aux 54 pays africains, opérateurs et profils Go illimités en mode plein écran.
            </p>
            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <p>Compatibilité : Android Chrome (WebAPK) · iOS Safari (Écran d’accueil)</p>
              <p>Quota : Trafic Go illimité sur l’ensemble des opérateurs africains</p>
            </div>
          </div>

          <div className="mt-6">
            <PWAInstallButton label="Installer sur ce téléphone" />
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
              <FileCode2 className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold">
                2. Projet Android APK Universel (.zip)
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Archive Gradle/Kotlin prête à compiler en fichier <span className="font-mono text-xs">.apk</span> universel (via Android Studio ou automatiquement sur GitHub Actions sans PC), embarquant les 54 pays africains et la connexion IP directe.
            </p>
            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <p>Architectures : arm64-v8a · armeabi-v7a · x86 · x86_64 (isUniversalApk = true)</p>
              <p>Système : Android 7.0 à Android 15 (API 24–35) · VpnService + WireGuard GoBackend</p>
              <p>Inclus : UniversalVpnService.kt · MainActivity.kt · gradle.properties · GitHub Actions CI</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleDownloadApkProject}
              disabled={buildingZip}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>
                {buildingZip
                  ? 'Génération du projet Kotlin…'
                  : 'Télécharger le projet APK Universel (.zip)'}
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Universal Tunnel Config & QR Code */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              3. Profil VPN Universel (.conf / .ovpn) & QR Code Mobile
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Profil actif : {activeServer.country} ({activeServer.dialCode}) · {activeOperator} · IP passerelle {activeServer.gatewayIp} · Go illimité.
            </p>
          </div>

          <div className="flex items-center gap-1 self-start rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setConfigFormat('wireguard')}
              className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                configFormat === 'wireguard'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              WireGuard (.conf)
            </button>
            <button
              type="button"
              onClick={() => setConfigFormat('openvpn')}
              className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                configFormat === 'openvpn'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              OpenVPN (.ovpn)
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* QR Code Panel */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 lg:col-span-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code WireGuard pour ${activeServer.country} (${activeOperator})`}
                className="h-48 w-48 rounded-lg bg-white p-2 shadow-sm"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 dark:border-slate-700">
                <QrCode className="h-10 w-10" aria-hidden="true" />
              </div>
            )}
            <div className="mt-3 flex items-center justify-center gap-2">
              <LogoImage
                src={getCountryLogoUrl(activeServer.countryCode)}
                alt={`Drapeau ${activeServer.country}`}
                fallbackText={activeServer.countryCode}
                className="h-5 w-7 rounded border border-slate-200 object-cover dark:border-slate-700"
              />
              <LogoImage
                src={getOperatorLogoUrl(activeOperator)}
                alt={`Logo ${activeOperator}`}
                fallbackText={activeOperator.slice(0, 2).toUpperCase()}
                className="h-5 w-5 rounded object-cover"
              />
              <p className="text-center text-xs font-medium text-slate-700 dark:text-slate-300">
                {activeServer.country} ({activeServer.dialCode}) · {activeOperator}
              </p>
            </div>
            <p className="mt-1 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {activeServer.gatewayIp}:{activeServer.wgPort}
            </p>
          </div>

          {/* Config Code Preview + Download */}
          <div className="flex flex-col justify-between lg:col-span-8">
            <pre className="max-h-72 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 dark:border-slate-800">
              {displayedConfig}
            </pre>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadConfig}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>
                  Télécharger {configFormat === 'wireguard' ? '.conf' : '.ovpn'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyConfig}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Profil copié' : 'Copier la configuration'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

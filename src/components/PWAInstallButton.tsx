import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  label,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>{label || (compact ? 'Installer' : 'Installer l’app')}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>{label || (compact ? 'Installer' : isIOS ? 'Installer iOS' : 'Installer l’app')}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="pwa-guide-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Installer Kestrel VPN sur mobile
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Accès natif plein écran hors ligne sur Android et iOS.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Fermer le guide d’installation"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Sur Android (Chrome / Edge)</p>
                <p className="mt-1.5">
                  Ouvrez le menu du navigateur et touchez « Installer l’application » ou « Ajouter à l’écran d’accueil » pour générer le raccourci APK WebAPK.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Sur iPhone / iPad (Safari)</p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                  <li className="flex items-center gap-1.5">
                    <span>Touchez l’icône Partager</span>
                    <Share className="inline h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <span>dans Safari.</span>
                  </li>
                  <li>Sélectionnez « Sur l’écran d’accueil » puis confirmez.</li>
                </ol>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 min-h-[44px] w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};

import React from 'react';
import { Globe, Moon, PackageCheck, Shield, Sun, Wrench } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';
import type { VpnTab } from '../types';

interface NavigationProps {
  activeTab: VpnTab;
  connected: boolean;
  onSelectTab: (tab: VpnTab) => void;
}

const NAV_ITEMS: { id: VpnTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'connect', label: 'Connexion', icon: Shield },
  { id: 'servers', label: 'Serveurs', icon: Globe },
  { id: 'tools', label: 'Outils', icon: Wrench },
  { id: 'apk', label: 'Export APK', icon: PackageCheck },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  connected,
  onSelectTab,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const activeLabel = NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Connexion';

  return (
    <>
      {/* Desktop Top Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 hidden border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('connect')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Kestrel VPN
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav aria-label="Navigation principale" className="flex items-center gap-7">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary action */}
          <div className="flex items-center shrink-0">
            <PWAInstallButton compact />
          </div>
        </div>
      </header>

      {/* Mobile Compact Top App Bar (48px height, <=15% sticky cap with bottom bar) */}
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
          Kestrel VPN
        </span>

        <span className="truncate px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {activeLabel}
        </span>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          className="flex min-h-[44px] min-w-[44px] items-center justify-end text-slate-600 dark:text-slate-300"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* Mobile Fixed Thumb-Zone Bottom Tab Bar */}
      <nav
        aria-label="Navigation mobile"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
      >
        <div className="grid h-14 grid-cols-4 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.id === 'connect' && connected && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950"
                    />
                  )}
                </span>
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

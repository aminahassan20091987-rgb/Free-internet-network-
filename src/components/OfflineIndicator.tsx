import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg lg:bottom-6"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Mode hors ligne — Données en cache affichées</span>
    </div>
  );
};

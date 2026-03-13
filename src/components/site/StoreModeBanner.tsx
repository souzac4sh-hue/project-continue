import { AlertTriangle, WifiOff, Clock } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export function StoreModeBanner() {
  const { settings } = useStore();

  if (settings.storeMode === 'online') return null;

  const isBusy = settings.storeMode === 'busy';
  const isOffline = settings.storeMode === 'offline';

  const defaultMessage = isBusy
    ? '🟡 Alta demanda no momento. Sua entrega pode levar mais tempo que o normal.'
    : '🔴 Loja offline no momento. Volte mais tarde.';

  const message = settings.storeModeMessage || defaultMessage;
  const Icon = isOffline ? WifiOff : Clock;

  return (
    <div
      className={`w-full border-b py-2.5 px-4 ${
        isOffline
          ? 'bg-destructive/10 border-destructive/20'
          : 'bg-yellow-500/10 border-yellow-500/20'
      }`}
    >
      <div className="container flex items-center justify-center gap-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${isOffline ? 'text-destructive' : 'text-yellow-500'}`} />
        <p className={`text-xs font-medium ${isOffline ? 'text-destructive' : 'text-yellow-600'}`}>
          {message}
        </p>
      </div>
    </div>
  );
}

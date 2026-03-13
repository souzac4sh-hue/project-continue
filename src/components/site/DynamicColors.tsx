import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';

/**
 * Applies dynamic color CSS variables based on admin settings.
 * Only overrides primary-derived variables, surfaces stay fixed.
 */
export function DynamicColors() {
  const { settings, settingsLoaded } = useStore();

  useEffect(() => {
    if (!settingsLoaded) return;

    const { primaryHue: h, primarySaturation: s, primaryLightness: l } = settings.colors;
    const root = document.documentElement;

    // Apply primary color
    root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
    root.style.setProperty('--neon', `${h} ${s}% ${Math.min(l + 5, 65)}%`);
    root.style.setProperty('--neon-light', `${h} ${Math.min(s, 100)}% ${Math.min(l + 12, 70)}%`);
    root.style.setProperty('--neon-dark', `${h} ${s}% ${Math.max(l - 6, 30)}%`);
    root.style.setProperty('--border', `${h} 28% 17%`);
    root.style.setProperty('--sidebar-primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--sidebar-border', `${h} 28% 17%`);
    root.style.setProperty('--sidebar-ring', `${h} ${s}% ${l}%`);

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--neon');
      root.style.removeProperty('--neon-light');
      root.style.removeProperty('--neon-dark');
      root.style.removeProperty('--border');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-border');
      root.style.removeProperty('--sidebar-ring');
    };
  }, [settings.colors, settingsLoaded]);

  return null;
}
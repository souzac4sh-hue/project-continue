import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';

/**
 * Applies dynamic color CSS variables based on admin settings.
 * Only overrides if colors differ from default (43 74 49).
 */
export function DynamicColors() {
  const { settings, settingsLoaded } = useStore();

  useEffect(() => {
    if (!settingsLoaded) return;

    const { primaryHue: h, primarySaturation: s, primaryLightness: l } = settings.colors;
    const root = document.documentElement;

    // Apply primary color
    root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--accent', `${h} ${s}% ${l}%`);
    root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
    root.style.setProperty('--gold', `${h} ${s}% ${l}%`);
    root.style.setProperty('--gold-light', `${h} ${Math.min(s + 6, 100)}% ${Math.min(l + 16, 85)}%`);
    root.style.setProperty('--gold-dark', `${h} ${Math.max(s - 4, 0)}% ${Math.max(l - 14, 15)}%`);
    root.style.setProperty('--border', `${h} 40% 16%`);
    root.style.setProperty('--sidebar-primary', `${h} ${s}% ${l}%`);
    root.style.setProperty('--sidebar-border', `${h} 20% 18%`);
    root.style.setProperty('--sidebar-ring', `${h} ${s}% ${l}%`);

    return () => {
      // Reset to defaults on unmount
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--gold');
      root.style.removeProperty('--gold-light');
      root.style.removeProperty('--gold-dark');
      root.style.removeProperty('--border');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-border');
      root.style.removeProperty('--sidebar-ring');
    };
  }, [settings.colors, settingsLoaded]);

  return null;
}

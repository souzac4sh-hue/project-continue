

# Professional Color System Refinement — C4SH STORE

## Problem

Current theme uses `200 100% 50%` as primary — a bright, flat cyan-blue that reads as "baby blue" on dark backgrounds. The backgrounds (`240 10% 4%` and `240 10% 8%`) use a purple-gray hue instead of a deep navy, creating a disconnect. The result looks generic and lacks depth.

## Design System Approach

### 1. New CSS Variable System (src/index.css)

Replace `:root` with a refined, layered palette using the user's exact hex values converted to HSL:

```
--background:    213 50% 3%      (#05070B — near-black navy)
--foreground:    210 60% 95%     (#EAF4FF — cool white)
--card:          213 35% 7%      (#0E1622 — surface-1)
--card-foreground: 210 60% 95%

--popover:       213 35% 7%
--popover-foreground: 210 60% 95%

--primary:       213 100% 52%    (#0A84FF — Apple-style blue)
--primary-foreground: 213 50% 3%

--secondary:     213 30% 11%     (#111D2D — surface-2)
--secondary-foreground: 210 60% 95%

--muted:         213 25% 13%
--muted-foreground: 210 18% 55%  (#8EA3B8 — desaturated blue-gray)

--accent:        197 100% 50%    (#00B2FF — neon accent, used sparingly)
--accent-foreground: 213 50% 3%

--border:        215 60% 18%     (rgba(37,122,255,0.18) equivalent)
--input:         213 30% 12%
--ring:          213 100% 52%

--neon:          197 100% 50%    (#00B2FF)
--neon-light:    191 100% 60%    (#33D6FF)
--neon-dark:     213 100% 48%    (#0077F6)
```

Add new custom properties for advanced effects:
```
--glow-soft:     0 0 24px rgba(0,178,255,0.18)
--glow-cta:      0 0 34px rgba(10,132,255,0.28)
--gradient-primary: linear-gradient(135deg, #0A84FF, #00B2FF)
--surface-1:     213 35% 7%
--surface-2:     213 30% 11%
```

Sidebar variables updated to match the new navy-dark palette.

### 2. Utility Classes Refinement (src/index.css)

- `.gold-gradient` → `linear-gradient(135deg, #0A84FF 0%, #00B2FF 100%)` — deeper, angled
- `.gold-text` → gradient from `#0A84FF` to `#00B2FF` — less cyan, more controlled
- `.glass-card` background → `hsl(213 35% 7% / 0.92)` with `border: 1px solid rgba(37,122,255,0.10)` 
- `.glass-card:hover` → `border-color: rgba(0,178,255,0.22)` + `box-shadow: 0 8px 32px rgba(10,132,255,0.08), 0 2px 8px rgba(0,0,0,0.4)`
- `.pulse-glow` → keyframe using `rgba(10,132,255,0.25)` instead of flat cyan
- `.neon-glow` → `box-shadow: var(--glow-soft)`
- `.shimmer::after` → `rgba(10,132,255,0.04)` — subtler
- `::selection` → `rgba(10,132,255,0.3)`
- `.gold-text-animated` → gradient `#0A84FF → #00B2FF → #0A84FF` — tighter range

### 3. Default Colors in mockData.ts

Update `defaultSettings.colors`:
- `primaryHue: 213` (was 200)
- `primarySaturation: 100` (keep)
- `primaryLightness: 52` (was 50)
- `accentHue: 197`, `accentSaturation: 100`, `accentLightness: 50`

### 4. DynamicColors.tsx

Update the border derivation to use the new hue math:
- `--border` → `${h} 60% 18%` (was `20%` saturation — too gray)
- `--background` can remain CSS-driven (DynamicColors only adjusts primary-derived vars)

### 5. Component Touch-ups

**SiteHeader** — `bg-background/95` → `bg-background/98`; bottom border `border-border/20`; logo icon uses new gradient. Online badge stays green.

**HeroCarousel** — Add a subtle radial glow overlay: `radial-gradient(ellipse at 50% 80%, rgba(10,132,255,0.08), transparent 70%)` behind content. Text shadow uses `rgba(10,132,255,0.25)`.

**AuthoritySection** (stat cards) — Icon circle `bg-primary/8` instead of `/10`. Card hover shadow references `rgba(10,132,255,0.06)` not `hsl(43...)`. Remove old gold HSL references.

**ProductCard** — Remove old gold hover shadow `hsl(43_74%_49%/0.12)` → `rgba(10,132,255,0.08)`. Badge `premium` stays `bg-cyan-600`.

**TrustBar** — Border `border-primary/8` (subtler). Icon opacity `text-primary/50`.

**VipCTA** — Already uses `gold-gradient` → auto-updates. Inner decorative circles use `border-primary-foreground/8`.

**FloatingButtons** (mobile bottom nav) — Background shadow → `rgba(10,132,255,0.06)`. Active indicator uses new gradient. Active item gets subtle `text-shadow: 0 0 12px rgba(10,132,255,0.3)`.

**ProductPage** — CTA button shadow `shadow-primary/15` (less intense). Sticky bar same. Benefits card border `border-primary/8`.

**PixCheckoutPage** — QR container `ring-2 ring-primary/12` (was `/15`). TrustPill border `border-primary/6`. Copy button uses new gradient. Nudge card border `border-yellow-500/15`.

**SiteFooter** — Logo icon uses new gradient. Divider `bg-border/30`.

### 6. Tailwind Config

No structural changes needed — all colors reference CSS variables which are being updated.

## Files Modified

1. `src/index.css` — Complete `:root` rewrite + utility class refinement
2. `src/data/mockData.ts` — Default color HSL values
3. `src/components/site/DynamicColors.tsx` — Border saturation derivation
4. `src/components/site/ProductCard.tsx` — Remove gold HSL hover shadow
5. `src/components/site/AuthoritySection.tsx` — Remove gold HSL hover reference
6. `src/components/site/FloatingButtons.tsx` — Mobile nav shadow + active glow
7. `src/components/site/HeroCarousel.tsx` — Add radial glow overlay
8. `src/pages/ProductPage.tsx` — CTA shadow refinement
9. `src/pages/PixCheckoutPage.tsx` — QR ring + TrustPill border refinement

## What This Does NOT Touch

- Pix payment logic
- Edge functions
- Database / migrations
- Admin panel functionality
- Storage / uploads
- Ninja mascot logic
- Coupon system


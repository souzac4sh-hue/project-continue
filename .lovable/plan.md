

# Phase 2 Implementation Plan — C4SH STORE

## Overview

This phase covers three major workstreams: (1) dark neon blue theme, (2) ninja mascot gamification, and (3) coupon discount system. The plan preserves all existing functionality — Pix flow, storage, admin modules, store/maintenance modes.

---

## 1. Dark + Neon Blue Premium Theme

**What changes:** Replace the gold/yellow HSL color system with neon blue across the entire app.

### CSS Variables (src/index.css)
Replace the `:root` block with neon blue values:
- `--primary`: 200 100% 50% (≈ #00A8FF)
- `--accent`: 200 100% 50%
- `--gold` / `--gold-light` / `--gold-dark`: replaced with blue equivalents
- `--border`: 200 20% 18%
- `--ring`: 200 100% 50%
- `--background`: 240 10% 4% (≈ #0B0B0F)
- `--card`: 240 10% 8% (≈ #14141A)
- `--foreground`: 230 20% 92% (≈ #EAEAF0)
- `--muted-foreground`: 230 5% 67% (≈ #A9A9B5)
- Sidebar vars updated to match

### Utility Classes (src/index.css)
- `.gold-gradient` → blue gradient (`linear-gradient(90deg, #0090FF, #00A8FF)`)
- `.gold-text` → blue gradient text
- `.glass-card` hover → blue glow instead of gold
- `.pulse-glow` → blue pulse
- Shimmer and animated gradient → blue tones

### Default Color Settings (src/data/mockData.ts)
Update `defaultSettings.colors` default HSL values to match neon blue (hue ~200, saturation ~100, lightness ~50).

### DynamicColors (src/components/site/DynamicColors.tsx)
No structural change needed — it already applies dynamic HSL values from settings. The defaults just change.

### Component-level touch-ups
- `ProductCard.tsx`: Change `gold-gradient` on "Ver" button (already uses the utility class, will auto-update)
- `ProductPage.tsx`: `.gold-text` price → auto-updates via CSS
- `PixCheckoutPage.tsx`: `.gold-gradient` copy button → auto-updates
- `SiteHeader.tsx`, `SiteFooter.tsx`, `VipCTA.tsx`: Accent references auto-update via CSS variables

### Badge colors in ProductCard
- `premium` badge: change from `gold-gradient` to a blue/cyan premium style (`bg-cyan-600 text-white`)

---

## 2. Visual Polish

### Homepage (ShopPage.tsx)
- Add `py-` spacing improvements between sections
- Wrap "Mais procurados" section header with subtle blue accent line

### Product Page (ProductPage.tsx)
- Product image: add subtle `ring-1 ring-primary/10` border
- Price: already uses `.gold-text` (auto-updates to blue)
- Benefits card: add `border-primary/10` accent
- CTA button: change `gold-gradient` → new blue gradient class
- Sticky bar: same gradient update

### Checkout (PixCheckoutPage.tsx)
- QR code container: add `ring-2 ring-primary/20` and subtle shadow
- Copy button: already uses `gold-gradient` → auto-updates
- Trust strip pills: add `border-primary/15` subtle accent
- Success state: add blue confetti-like glow effect via CSS
- No logic changes to Pix flow

---

## 3. Ninja Mascot System

### New Component: `src/components/site/NinjaMascot.tsx`
- Pure CSS/SVG ninja character (lightweight, no external assets needed)
- Uses `requestAnimationFrame` or CSS `@keyframes` for run animation
- Slides across bottom of screen from left to right (or right to left randomly)
- On click: shows reward popup

### Behavior Logic
- Timer: random interval between 3-5 minutes (180-300 seconds)
- Uses `useState` + `useEffect` with `setTimeout`
- Respects cooldown per session (localStorage tracks last appearance timestamp)
- Mobile-friendly: ninja is ~40px tall, stays near bottom

### Ninja Settings in StoreContext
Add to `Settings` interface in `mockData.ts`:
```
ninjaSettings: {
  enabled: boolean;
  frequencyMin: number;     // default 3
  frequencyMax: number;     // default 5
  cooldownMinutes: number;  // default 10
  discountCodes: string[];  // e.g. ["NINJA5", "NINJA10"]
  rewardMessage: string;
  showReward: boolean;
}
```

### Reward Popup
- Small modal/toast appears on click
- Shows configurable message + random code from `discountCodes`
- "Copy" button copies code to clipboard
- Auto-dismisses after 8 seconds

### Integration
- Add `<NinjaMascot />` to `ShopPage.tsx` and `ProductPage.tsx` (public pages only)
- Reads settings from `useStore()`

---

## 4. Coupon Discount System

### Database: New `coupons` table (migration)
```sql
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  expires_at timestamptz,
  usage_limit integer,
  times_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- Public can read active coupons (for validation)
CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (active = true);
-- Admin full access
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Admin Module: `src/components/admin/AdminCoupons.tsx`
- CRUD interface for coupons
- Fields: code, discount type (% or fixed R$), value, active toggle, expiration date, usage limit
- Add to `AdminPage.tsx` modules list under "Marketing" group

### Checkout Integration
- Add coupon input field to the purchase dialog in `ProductPage.tsx`
- Validate coupon against database (check active, not expired, usage limit)
- Calculate discounted price
- Pass discounted amount to `create-pix-payment` edge function
- Add `coupon_code` and `discount_amount` fields to `pix_orders` table (migration)
- Show original price crossed out + discounted price in checkout

### Edge Function Update
- `create-pix-payment`: accept optional `couponCode` parameter, validate server-side, apply discount to Pix amount

---

## 5. Admin Ninja Module

### New Component: `src/components/admin/AdminNinja.tsx`
- Toggle enable/disable
- Frequency range (min/max minutes)
- Cooldown setting
- Discount codes list (add/remove)
- Reward message text
- Enable/disable reward popup

### Integration
- Add to `AdminPage.tsx` modules under "Marketing" group with a ninja icon (Sword or similar from lucide)
- Settings stored in `site_config.settings.ninjaSettings` via existing StoreContext save mechanism

---

## Technical Notes

- **No new dependencies required** — ninja uses CSS animations + inline SVG
- **No Pix flow changes** — only the coupon discount modifies the amount passed to the existing edge function
- **All settings persist** via existing `site_config` table (ninja settings) and new `coupons` table
- **Theme changes are purely CSS** — existing components using utility classes auto-update
- **Mobile-first** — ninja character and coupon input tested for small viewports

---

## Execution Order

1. Theme CSS + defaults update (biggest visual impact, safest change)
2. Visual polish on components
3. Coupons table migration + admin module + checkout integration
4. Ninja mascot component + admin module
5. Final integration testing


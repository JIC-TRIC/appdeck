# Piano Practice Tracker — Design Philosophy

## Core Identity: **Brutalist-Minimal Dark Interface**

This app rejects the generic "modern dark mode" aesthetic. Instead, it embraces a **raw, stripped-back brutalism** fused with the sophistication of a **music production tool**. Think: Ableton Live meets a vinyl record sleeve. Every pixel earns its place.

---

## 1. Color System

### Philosophy

Color is **functional, not decorative**. The background is pure void. Surfaces barely exist — they're whispers of differentiation, not boxes. Accent color is used with **surgical precision**: only for interactive elements and key data.

### Tokens

```
--background:    #000000          (pure black — not near-black, BLACK)
--surface:       #0a0a0a          (1 shade above void — barely visible)
--surface-light: #141414          (for elevated elements only)
--border:        rgba(255,255,255,0.04)  (near-invisible separation)
--text:          #e5e5e5          (warm white, not pure white — reduces strain)
--text-secondary:#525252          (low contrast, background-level)
--text-tertiary: #333333          (for labels that are felt, not read)
```

### Accent Rules

- Primary accent used ONLY on: active states, key metrics, progress indicators
- No colored backgrounds on cards — cards are borderless or hairline-bordered
- Status colors are muted: `--success: #22c55e40`, `--warning: #eab30840`, `--danger: #ef444440` (40% opacity variants)

---

## 2. Typography

### Philosophy

**One weight to rule them all.** Typography uses a monospace-first approach for data and a razor-thin sans-serif for everything else. Headers are NOT bold — they use **letter-spacing and caps** to create hierarchy.

### Scale

```
--font-mono:     'JetBrains Mono', 'SF Mono', 'Fira Code', monospace
--font-sans:     'Inter', -apple-system, sans-serif

Sizes:
--text-xs:  0.65rem    (labels, metadata)
--text-sm:  0.78rem    (body, descriptions)
--text-md:  0.88rem    (default)
--text-lg:  1rem       (section headers — NOT larger)
--text-xl:  1.15rem    (page title — modestly sized)
```

### Rules

- **All caps + wide tracking** (0.12em) for section labels, tab labels, phase names
- **Monospace** for ALL numeric data: timers, stats, counts, versions
- Body weight: 400 (regular). Never use 700+ on body text
- Headers: 500 weight maximum. Hierarchy through spacing and case, not boldness
- No font-size above 1.5rem anywhere in the app (except timer display)

---

## 3. Spacing & Layout

### Philosophy

**Density is a feature.** This is a tool, not a magazine. Information should be tightly packed but breathable. Generous whitespace is replaced with **precise micro-spacing**.

### Tokens

```
--space-1: 2px
--space-2: 4px
--space-3: 6px
--space-4: 8px
--space-5: 12px
--space-6: 16px
--space-7: 24px
```

### Rules

- Card padding: 10-12px (not 14-20px)
- Gap between cards: 6px (not 10-16px)
- Section margin: 16px (not 20-24px)
- No padding above 24px anywhere
- Mobile grid: 2 columns at 4px gap

---

## 4. Borders & Surfaces

### Philosophy

**Borders are barely there.** Surfaces don't need boxes — they're differentiated by subtle background shifts. When borders exist, they're `1px solid rgba(255,255,255,0.04)` — visible only if you look.

### Rules

- **No border-radius above 4px.** Cards: 4px. Buttons: 2px. Inputs: 2px. Chips: 2px.
- `--radius-sm: 2px`, `--radius-md: 3px`, `--radius-lg: 4px`
- No box shadows anywhere. Zero. None.
- No backdrop-filter blur (removes blur from modal overlay)
- Cards have NO border by default. Only add border on hover/focus/active
- Modal overlay: `rgba(0,0,0,0.9)` — near-opaque, commanding focus

---

## 5. Buttons & Interactive Elements

### Philosophy

Buttons are **flat, monochrome, and text-forward**. Primary actions use a subtle primary-color text/border, not filled backgrounds. The only filled button is the main CTA.

### Rules

- Default button: transparent bg, `--border`, text color
- Active/selected: `color: var(--primary)`, `border-color: var(--primary)` — NOT filled
- Primary CTA (Add Piece, Save): filled with `var(--primary)`, this is the ONLY filled button type
- Button padding: `6px 12px` — tight, not generous
- Touch targets: minimum 40px height on mobile (achieved via height, not padding)
- Transitions: `0.1s ease` — snappy, not sluggish (0.15s was too slow)
- Active state: `opacity: 0.7` — no scale transforms, no background changes

---

## 6. Cards (Piece Cards)

### Philosophy

Cards are **transparent containers** — the content IS the card. Thumbnails bleed edge-to-edge. Metadata is ultra-compact.

### Rules

- Card background: `var(--surface)` or transparent
- Border: `1px solid var(--border)` — near invisible
- Thumbnail: full width, no border-radius on top
- Title directly below thumbnail, tight padding (8px)
- Status and difficulty as **small monospace tags**, not colored badges
- Progress dots: 5px, square (1px radius), tight spacing

---

## 7. Navigation

### Philosophy

Navigation is **invisible until needed**. The bottom nav is a thin rail. The header is minimal — logo and nothing else unless in context.

### Rules

- Bottom nav: height 48px max, pure black background, no border-top (just a hairline shadow)
- Nav labels: uppercase, monospace, 0.6rem
- Active indicator: primary color on icon+text only, no background highlight
- Header: minimal height, no background color difference — uses only a hairline bottom border

---

## 8. Modals

### Philosophy

Modals are **full-focus environments**. The overlay is near-opaque. The content panel is tight, borderless, with a dark surface.

### Rules

- Overlay: `rgba(0,0,0,0.92)` — NO blur
- Content: `var(--surface)`, `border-radius: 4px`, `border: 1px solid var(--border)`
- No animation on open (instant appearance)
- Form inputs: minimal height, `background: var(--background)`, hairline border
- Labels: uppercase monospace, `--text-tertiary` color

---

## 9. Progress & Data Visualization

### Philosophy

Data is displayed in **raw, numeric form**. Visualizations are geometric and minimal — no gradients, no rounded ends on bars.

### Rules

- Progress bars: 3px height, square ends, `var(--surface-light)` track, `var(--primary)` fill
- Calendar heatmap: square cells, no border-radius, 4 intensity levels using opacity of primary
- Stats: monospace numbers, large size, minimal labeling
- Timer: monospace, `--primary` color, centered, 2rem

---

## 10. Animation & Motion

### Philosophy

**Motion is almost absent.** The interface is static and confident. The only motion is functional feedback.

### Rules

- No entry animations on page/view switches
- No fadeIn on card grids
- Button press: `opacity: 0.7`, 0.1s — that's it
- Modal: instant open, subtle close
- Transition duration: never exceed 0.15s

---

## 11. Mobile-First Imperatives

### Rules

- All touch targets: minimum 40px
- Font size never below 12px (0.75rem) for readable text
- 2-column card grid on mobile (≤480px)
- Search input: 16px font-size (prevents iOS zoom)
- Safe area insets respected (env())
- No hover effects — all interaction via :active
- Thumb-friendly bottom navigation

---

## Summary: What Makes This Radical

| Old Approach                     | New Approach                      |
| -------------------------------- | --------------------------------- |
| Near-black backgrounds (#09090b) | Pure black (#000000)              |
| 4/6/8px border-radius            | 2/3/4px — near-square everything  |
| 600-700 font weights             | 400-500 max — light touch         |
| Colored badges and fills         | Monochrome with precision color   |
| 0.15-0.3s transitions            | 0.1s max — instant feel           |
| Surface cards with padding       | Transparent containers, dense     |
| System font stack                | Monospace-first for data          |
| Decorative borders               | Near-invisible hairlines          |
| Entry animations                 | No animations — static confidence |
| Bold section headers             | Uppercase tracking, light weight  |

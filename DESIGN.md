# Carbon Mirror Design System Documentation

This document serves as the design system specification for the **Carbon Mirror** web application, based on the handoff from Google Stitch.

## Color Palette

The interface is built around **Deep Space Black** as the infinite background level, accented by glowing, high-contrast colors indicating environmental status.

| Token | Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| **Deep Space Black** | `--cm-color-bg-primary` | `#0A0E1A` | Main page background (Level 0) |
| **Carbon Gray** | `--cm-color-bg-surface` | `#1E2535` | Card/panel backgrounds (Level 1) |
| **Bioluminescent Teal** | `--cm-color-accent-teal` | `#00E5C3` | Primary interactive, "healthy" status, primary button |
| **Ember Coral** | `--cm-color-accent-coral` | `#FF5C35` | Alerts, high-impact emissions warnings |
| **Sage Mist** | `--cm-color-accent-sage` | `#A8D5A2` | Moderate positive actions, low emissions |
| **Dust Gold** | `--cm-color-accent-gold` | `#C9A84C` | achievements, secondary metrics, prestige highlights |
| **Haze Purple** | `--cm-color-accent-purple` | `#6B4FA0` | AI Carbon Coach features and insights |
| **Stellar White** | `--cm-color-text-primary` | `#F0F4FF` | Primary typography and highlights |

## Typography

Three fonts are used to enforce the scientific instruments aesthetic ("NASA-meets-Modern").

### Font Families
- **Display & Headlines:** `'Space Grotesk', sans-serif` (Geometric, technical)
- **Body & UI:** `'Inter', sans-serif` (Highly legible in dark mode)
- **Data & Metrics:** `'JetBrains Mono', monospace` (Used for calculations and values)

### Typographic Hierarchy

| Token | Font Family | Size | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Space Grotesk | `72px` | `700` | `80px` | `-0.02em` |
| `display-lg-mobile` | Space Grotesk | `40px` | `700` | `48px` | `-0.02em` |
| `headline-lg` | Space Grotesk | `48px` | `700` | `56px` | `-0.02em` |
| `headline-md` | Space Grotesk | `32px` | `700` | `40px` | `0` |
| `body-lg` | Inter | `18px` | `400` | `1.6` | `0` |
| `body-md` | Inter | `16px` | `400` | `1.6` | `0` |
| `body-md-bold` | Inter | `16px` | `500` | `1.6` | `0` |
| `metric-lg` | JetBrains Mono | `24px` | `500` | `32px` | `0` |
| `metric-sm` | JetBrains Mono | `14px` | `500` | `20px` | `0.05em` |
| `label-caps` | JetBrains Mono | `12px` | `500` | `16px` | `0.1em` |

## Spacing & Layout

The spacing system is built around an **8px base unit**.

- **Base Unit:** `8px`
- **Stack Small (`stack-sm`):** `16px` (Tight groupings, label gaps)
- **Stack Medium (`stack-md`):** `32px` (Internal card padding, layout gaps)
- **Stack Large (`stack-lg`):** `48px` (Element groupings, page sections)
- **Gutter:** `24px` (Grid separation)
- **Section Mobile:** `40px` (Page top/bottom margins on small viewports)
- **Section Desktop:** `80px` (Page top/bottom margins on large viewports)
- **Max Width:** `1200px` (Content boundary container)

## Elevation & Visual Depth

1. **Level 0 (Background):** Deep Space Black (`#0A0E1A`) with atmospheric drift starfield.
2. **Level 1 (Surface panels):** Carbon Gray (`#1E2535`) with 1px border (`rgba(255, 255, 255, 0.1)`).
3. **Level 2 (Hover/Active):** Bioluminescent Teal outer glow (`box-shadow: 0 0 25px rgba(0, 229, 195, 0.2)`).
4. **Glassmorphism:** Navigation bar and overlay modals (`backdrop-filter: blur(12px)` + `background: rgba(10, 14, 26, 0.8)`).

## Corner Rounding

- **Small (`sm`):** `4px` (`0.25rem`) - Badges, small pills.
- **Medium (`DEFAULT`):** `8px` (`0.5rem`) - Default buttons, form fields.
- **Large (`md`):** `12px` (`0.75rem`) - Cards, panels, modal boxes.
- **Extra Large (`lg`):** `16px` (`1rem`) - Section components.
- **Double Extra Large (`xl`):** `24px` (`1.5rem`) - Outer containers.
- **Full (`full`):** `9999px` - Pill-shaped buttons, tags, and circular components.

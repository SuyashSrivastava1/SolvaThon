---
name: Obsidian Precision
colors:
  surface: '#11131b'
  surface-dim: '#11131b'
  surface-bright: '#373942'
  surface-container-lowest: '#0c0e16'
  surface-container-low: '#191b24'
  surface-container: '#1d1f28'
  surface-container-high: '#282a32'
  surface-container-highest: '#33343d'
  on-surface: '#e2e1ed'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#e2e1ed'
  inverse-on-surface: '#2e3039'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#56e5a9'
  on-tertiary: '#003824'
  tertiary-container: '#30c88f'
  on-tertiary-container: '#004e34'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#11131b'
  on-background: '#e2e1ed'
  surface-variant: '#33343d'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 4rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses a bleeding-edge, high-precision aesthetic engineered for advanced machine intelligence and next-generation developer platforms. The mood is calculated, serene, and commanding—evoking optical precision instruments operating within deep space. 

The aesthetic fuses Minimalist structural discipline with high-end Glassmorphic micro-surfaces and low-illumination ambient lighting. High contrast is achieved through luminescence rather than heavy fills: pristine dark voids layered with subtle optical noise, razor-sharp graphite delineation, and laser-precise cyan emitters.

## Colors

The palette relies on a controlled, low-albedo environment punctuated by photonic light emissions:

- **Base Void (`#090A0F`)**: Canvas background. Absolute deep obsidian creating infinite depth.
- **Surface Elevation 1 (`#0D0F17`)**: Primary card panels and section containers.
- **Surface Elevation 2 (`#131722`)**: Elevated hover surfaces, floating tooltips, and interactive micro-widgets.
- **Graphite Dividers & Borders (`#1F2433`, `#2A3146`)**: Subdued, cold-spectrum stroke values defining architecture without visual noise.
- **Primary Optical (`#38BDF8`) & Secondary Kinetic (`#0EA5E9`)**: High-energy electric cyan utilized for active signals, critical metrics, and focused interfaces.
- **Tertiary Matrix (`#10B981`) & Spectral Accent (`#A855F7`)**: Secondary telemetry states denoting operational health and specialized computational threads.

## Typography

Visual hierarchy balances high-modern geometric clarity with technical instrumentation:

- **Headlines (Plus Jakarta Sans)**: Rendered with tight tracking and steep scale falloffs to convey density and deliberate form.
- **Body Text (Inter)**: Neutral, hyper-legible, set in slightly desaturated white (`#94A3B8` / `#E2E8F0`) to preserve low visual fatigue across complex layouts.
- **Technical Readouts (JetBrains Mono)**: Applied to badges, metadata labels, latency measurements, and system parameters, maintaining uppercase styling with widened tracking.

## Layout & Spacing

The layout is built upon a 12-column fluid grid system pinned to a maximum container width of 1440px.

- **Desktop (≥1024px)**: 12 columns, 24px gutters, and 64px outer margins. Content groups prioritize horizontal density and side-by-side data comparisons.
- **Tablet (768px - 1023px)**: 8 columns, 20px gutters, and 32px outer margins. Multi-metric widgets stack into 2-column configurations.
- **Mobile (<768px)**: 4 columns, 16px gutters, and 20px outer margins. Full structural verticalization with fluid width adherence.

## Elevation & Depth

Spatial separation avoids opaque drop shadows, relying instead on translucent layering, micro-borders, and radial illumination:

- **Layer 0 (Base)**: Solid background `#090A0F`.
- **Layer 1 (Containers)**: Background `rgba(13, 15, 23, 0.75)` with `backdrop-filter: blur(16px)` and an explicit `1px` border of `rgba(31, 36, 51, 0.8)`.
- **Layer 2 (Overlays & Menus)**: Background `rgba(19, 23, 34, 0.85)` with `backdrop-filter: blur(24px)` and a `1px` border of `rgba(56, 189, 248, 0.2)`.
- **Photonic Glow**: Active controls and focus states cast a directional radial glow: `box-shadow: 0 0 24px -4px rgba(56, 189, 248, 0.25)`.

## Shapes

The design system employs a refined, technical rounding model (`roundedness: 1`):

- **Controls and Inputs**: 4px (`0.25rem`) border radius, preserving surgical, instrument-grade corners.
- **Cards and Panels**: 8px (`0.5rem`) border radius for structural framing.
- **Modals and Visual Viewports**: 12px (`0.75rem`) border radius maximum.
- **Pills and Badges**: Fully circular (`9999px`) to create optical contrast against strict rectangular geometry.

## Components

- **Buttons**:
  - *Primary*: Background `#38BDF8`, text `#090A0F`, font-weight 600. On hover, smooth shift to `#0EA5E9` with an outward `0 0 16px rgba(56, 189, 248, 0.4)` bloom.
  - *Secondary / Ghost*: Transparent fill, `1px` border in `#2A3146`, text `#F8FAFC`. On hover, border shifts to `#38BDF8` with a subtle background wash of `rgba(56, 189, 248, 0.05)`.
- **Chips & Badges**:
  - Pill-shaped geometry. Background `rgba(56, 189, 248, 0.08)`, border `1px solid rgba(56, 189, 248, 0.25)`, text in `label-sm` (`#38BDF8`). Includes an integrated 4px circular LED status beacon.
- **Data Metric Widgets**:
  - Framed in `1px` graphite borders with upper-right monospaced index flags (e.g., `SYS.01`). Numerical values set in high-contrast `Plus Jakarta Sans` with micro sparklines rendered in electric cyan.
- **Input Fields**:
  - Background `rgba(13, 15, 23, 0.9)`, border `1px solid #1F2433`, text `#F8FAFC`. Placeholder in `#475569`.
  - *Focus State*: Border transitions to `#38BDF8` with a tight halo `box-shadow: 0 0 0 1px #38BDF8, 0 0 12px rgba(56, 189, 248, 0.2)`.
- **Checkboxes & Radios**:
  - Rigid, precision boxes (16x16px) with an interior inset indicator in `#38BDF8`. Unchecked state uses a recessed `#131722` fill with a `#2A3146` perimeter.
- **Cards**:
  - Glassy obsidian backgrounds with gradient micro-borders (subtle shift from `#2A3146` at the top to `#1F2433` at the base) to simulate an overhead technical rim light.
- **System Banners & Feedback**:
  - Clean edge-docked notifications featuring high-saturation left boundary indicators (`#EF4444` for critical errors, `#10B981` for sync confirmations) paired with monospaced log timestamps.
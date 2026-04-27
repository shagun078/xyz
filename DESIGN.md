---
name: Industrial Intelligence System
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  metric-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: 0.02em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  status-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 20px
  margin: 24px
---

## Brand & Style

This design system is built for high-stakes industrial monitoring and IoT management. The brand personality is authoritative, precise, and technologically advanced, aiming to reduce cognitive load while providing deep data insights. 

The aesthetic follows a **Modern Corporate** style with **Tonal Layering**. It prioritizes high contrast for critical status indicators while maintaining a sophisticated, subdued environment for long-term monitoring. The visual language evokes the feeling of a high-end command center—utilitarian yet polished—using subtle gradients and luminous accents to guide the user's eye to changing data points without causing visual fatigue.

## Colors

The palette is anchored in a deep "Midnight Navy" background to ensure maximum contrast for data visualization. 

- **Primary (Electric Blue):** Used for active data streams, interactive elements, and primary actions. It represents the "pulse" of the system.
- **Secondary (Emerald Green):** Dedicated strictly to positive status indicators, "Online" states, and healthy metric ranges.
- **Tertiary (Amber):** Reserved for warnings and non-critical maintenance alerts.
- **Surface Palette:** A range of soft grays and deep slates are used to differentiate container hierarchy. Cards use a semi-opaque slate to sit subtly above the background.
- **Data Visualization:** Use a distinct "Electric Blue" for primary charts, complemented by a "Cool Indigo" for secondary data sets to maintain a high-tech aesthetic.

## Typography

This design system utilizes **Inter** for its exceptional legibility at small sizes and its neutral, systematic character. 

- **Data Density:** Large metric displays use a Medium weight with slight tracking increases to ensure numbers are readable from a distance.
- **Hierarchy:** Labels for sensors and hardware should use the `label-caps` style to differentiate metadata from active data values.
- **Functional Clarity:** All numerical data in tables or charts should ideally use tabular-nums (monospaced numbers) features of the Inter font to prevent "jumping" during real-time updates.

## Layout & Spacing

The system employs a **Fluid Grid** model designed for high-density information environments. 

- **Grid:** A 12-column responsive grid with a 20px gutter ensures consistent alignment of metric cards and control panels.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Density:** In dashboard views, prioritize "Compact" spacing (16px between cards) to maximize the amount of visible data on a single screen. In configuration views, use "Wide" spacing (32px) to focus user attention on specific inputs.
- **Safe Zones:** Always maintain a 24px outer margin for the main application viewport to prevent edge-clutter.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** rather than traditional heavy shadows.

- **Level 0 (Background):** Deep Slate/Black (`#020617`).
- **Level 1 (Cards):** Surface Navy (`#1E293B`) with a subtle 1px inner border (opacity 10% white) to define edges against the background.
- **Level 2 (Overlays/Modals):** Lighter Slate with a soft, 20% opacity black shadow (24px blur) and a backdrop blur of 8px to create a "glass" effect for floating controls.
- **Interactive Depth:** Buttons use a very subtle outer glow of their primary color when hovered, suggesting a light-emitting hardware interface.

## Shapes

The design system uses a **Soft** shape language to balance technical precision with user-friendliness.

- **Standard Elements:** Metric cards, input fields, and buttons use a 4px (0.25rem) radius for a crisp, engineered look.
- **Status Badges:** Use a more aggressive rounding (12px or pill-shaped) to distinguish them clearly from interactive buttons.
- **Iconography:** Use 2px stroke weight with slight corner rounding to match the UI's geometric yet approachable feel.

## Components

### Metric Cards & Sparklines
Cards are the primary unit of the system. They feature a `label-caps` title, a large `metric-xl` value, and a integrated sparkline. Sparklines should be rendered in `Primary Blue` with a subtle area-fill gradient (10% opacity) beneath the stroke.

### Status Badges
Badges use a "Glowing Dot" pattern. A badge for 'Active' includes a solid `Emerald Green` circle with a subtle outer CSS animation pulse, accompanied by text in the same color.

### Elegant Control Buttons
Buttons are flat with high-contrast labels. Primary buttons use a solid `Primary Blue` fill. Secondary control buttons (e.g., Toggle Switches) should use a "Machine Switch" aesthetic—tactile and clear.

### Data Inputs
Input fields use a dark fill with a `Slate` border that transitions to `Primary Blue` on focus. Use monospaced fonts for numerical input to ensure alignment with dashboard metrics.

### Vertical Status Lists
For hardware logs, use a condensed list format with micro-dividers and timestamp labels in `accent_slate`. 

### Specialized IoT Components
- **Gauge Charts:** Semi-circular progress arcs for "Load" or "Capacity" monitoring.
- **Toggle Groups:** Segmented controls for switching between "Auto" and "Manual" machine states.
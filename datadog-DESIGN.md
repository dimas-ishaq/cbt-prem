---
version: alpha
name: Datadog
description: "An observability platform with a dark, density-optimized interface built around Datadog's purple (#774AA4 / #9C55E8) on a near-black canvas (#1B1B1B) with rich multi-color chart palettes and green/red semantic indicators for system health. The product serves engineers who monitor production infrastructure — the design prioritizes information density, visual scanning speed, and customizable dashboards over aesthetic refinement. The dog mascot (Bits) appears in marketing contexts; the product is serious, functional, and tailored for on-call engineers reading dashboards at 3am. Typography uses Inter or system fonts at small sizes for maximum data density."

colors:
  primary: "#774AA4"
  on-primary: "#ffffff"
  primary-hover: "#6A3E92"
  secondary: "#9C55E8"
  ink: "#E0E0E0"
  ink-muted: "#8A8A8A"
  canvas: "#1B1B1B"
  surface-1: "#242424"
  surface-2: "#2D2D2D"
  border: "#3D3D3D"
  success: "#1ABE71"
  danger: "#EF4444"
  warning: "#F5A623"
  info: "#2D9BF0"
  chart-1: "#9C55E8"
  chart-2: "#2D9BF0"
  chart-3: "#1ABE71"
  chart-4: "#F5A623"
  chart-5: "#EF4444"

typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

spacing:
  base: 8px
  scale: [2, 4, 8, 12, 16, 24, 32, 48, 64]

radius:
  sm: 2px
  md: 4px
  lg: 8px
  pill: 9999px

shadows:
  card: "0 1px 4px rgba(0,0,0,0.4)"
  elevated: "0 4px 16px rgba(0,0,0,0.5)"
  tooltip: "0 2px 8px rgba(0,0,0,0.6)"

motion:
  duration-fast: 80ms
  duration-base: 150ms
  easing: cubic-bezier(0.4, 0, 0.2, 1)
---

## Rationale

**Dark canvas for 3am readability** — The near-black #1B1B1B is not a trend choice — it's an operational decision. On-call engineers monitoring production dashboards often work in dark environments with multiple screens. Dark backgrounds reduce eye strain during extended monitoring sessions and make colored chart lines pop with maximum clarity.

**13px body as a density feature** — Going below the conventional 16px body reflects the nature of observability work: professionals monitoring metrics want to see more data, not more whitespace. Every pixel of vertical space in a log stream or dashboard grid is information. At 13px, Datadog can display a 30% denser log view than a standard-size product.

**Purple brand, neutral product** — #774AA4 appears on primary navigation and brand surfaces but almost never within dashboards themselves. This separation is intentional: purple in a chart series would look like brand decoration, not data. The product chrome uses brand color; the data surface is neutral so users can assign chart colors freely.

**Five-color chart palette as first-class system** — Allocating five dedicated chart colors (purple, blue, green, orange, red) that also double as semantic state colors creates a coherent visual language: when you see orange in a chart AND in an alert state, they mean the same category of concern. This alignment reduces the cognitive translation between data visualization and operational status.

**Configurable dashboard grid as core value proposition** — The drag-to-resize widget canvas reflects Datadog's philosophy that monitoring needs vary by team. Rather than imposing a fixed information hierarchy, the system provides composable primitives and lets engineering teams build exactly the visibility they need. The flexible grid is the product's most important design decision.

## 1. Visual Theme & Atmosphere
Datadog is purpose-built for the on-call engineer. The dark canvas isn't a trend choice — it's a practical decision for monitors that need to be readable on dark screens at night without eye strain. Every pixel of the dashboard is information: time-series charts, log streams, trace waterfalls, SLO burn rates. The purple brand color appears on primary navigation and brand moments; the product relies on a rich multi-color chart palette to differentiate metrics. The interface rewards expertise: dense, configurable, and powerful.

## 2. Color System
- **Purple primary**: #774AA4 — brand, primary navigation active state
- **Lighter purple**: #9C55E8 — interactive elements, chart series 1
- **Canvas**: #1B1B1B — dark enough for eye comfort, light enough to see screen reflections
- **Surface layers**: #242424 / #2D2D2D — dashboard panels, widget containers
- **Chart palette**: 5+ colors (purple, blue, green, orange, red) for multi-metric graphs
- **Semantic**: Green #1ABE71 (healthy), Red #EF4444 (alert), Orange #F5A623 (warning), Blue #2D9BF0 (info)

## 3. Typography
Inter at 13px body — smaller than most products, reflecting the density requirement of infrastructure dashboards. Every pixel of vertical space is used. Headers are 700 weight. Metric numbers display at larger sizes (24–36px) for at-a-glance reading from across the room. Monospace for log lines, trace IDs, and code.

## 4. Components & Patterns
- **Dashboard grid**: Configurable widget canvas, drag-to-resize, many widget types
- **Timeseries widget**: Line/area chart with multi-metric overlay, interactive crosshair, legend
- **Alert list**: Status dot + metric name + threshold + current value — scannable at speed
- **Log explorer**: Three-panel: filter bar / log list / log detail, with attribute facets left
- **APM trace waterfall**: Nested service spans, duration bar, error highlight in red
- **SLO widget**: Circular progress + burn rate chart + remaining error budget

## 5. Spacing & Layout
Dashboard: full-viewport grid, no fixed sidebar in dashboard mode. Nav is a slim left sidebar (48px icons only, expandable). Widget padding: 12px. Log rows: 24px height for density. Everything is configurable.

## 6. Motion & Interaction
Real-time chart updates stream smoothly. Alert state change animates the status dot. Log lines flow in as they arrive. Dashboard widget resize has smooth animation. Tooltip crosshair follows cursor precisely. Fast, because milliseconds matter in monitoring.

## Accessibility

### Contrast Ratios
- **Primary on background** (#774AA4 on #1B1B1B): 2.7:1 — decorative only
- **Text on background** (#E0E0E0 on #1B1B1B): 13.1:1 — passes AA, passes AAA
- **Muted on background** (#8A8A8A on #1B1B1B): 5.0:1 — passes AA, fails AAA

### Minimum Requirements
- **Touch target**: 44×44px minimum for all interactive elements
- **Focus indicator**: #774AA4 outline, 2px, 2px offset
- **Focus contrast**: 2.7:1 against #1B1B1B background

### Motion
- Respects `prefers-reduced-motion`: yes — all transitions and animations should be suppressed
- All transitions use `@media (prefers-reduced-motion: reduce)` guard

### Notes
- The purple primary #774AA4 reaches only 2.7:1 on the dark canvas — it fails AA for all text and UI components; use it only for large decorative elements, chart accents, and brand marks, never as standalone text.
- Focus rings using purple on dark will not meet the 3:1 UI component minimum; use a brighter variant (e.g. #9C55E8 at higher contrast) or a white/light outline instead.
- Real-time chart streaming and alert state dot animations should be suppressed under `prefers-reduced-motion`; static state snapshots are sufficient for accessibility.
- Multi-color chart palettes must not rely on color alone to distinguish series — always pair with labels, patterns, or dashed line styles to remain accessible for color-blind users.

---
colors:
  primary: 'oklch(0.6 0.14 255)'
  bg-site: 'oklch(0.17 0.02 255)'
  bg-card: 'oklch(0.23 0.02 260)'
  text-body: 'oklch(1 0 0)'
  text-heading: 'oklch(0.6 0.14 255)'
  color-link: 'oklch(0.45 0.18 35)'
  color-icon: 'oklch(0.3 0.06 255)'
  color-border: 'oklch(0.3 0.06 255)'
  color-muted: 'oklch(0.6 0.015 255)'
  color-success: 'oklch(0.6 0.15 150)'
  color-error: 'oklch(0.6 0.18 25)'
typography:
  font-body: "'Geist', system-ui, -apple-system, sans-serif"
  font-mono: "'Geist Mono', ui-monospace, SFMono-Regular, monospace"
---

# GitWarp Design System

This document is the single source of truth for the GitWarp design system. It contains all core design tokens used in the application.

## Core Design Philosophy

- **Simplicity and Elegance**: Rely on native capabilities over heavy abstractions.
- **Glassmorphism**: Surfaces and cards use subtle blurs and semi-transparency.
- **Color Space**: All colors use OKLCH for predictable, perceptually uniform gradients and states.

## Colors

The application relies strictly on the following OKLCH palette defined in `src/style.css`:

- **Primary / Accent**: `oklch(0.6 0.14 255)` — Used for primary actions, headings, and active borders.
- **Background (Site)**: `oklch(0.17 0.02 255)` — The deepest background color.
- **Background (Card)**: `oklch(0.23 0.02 260)` — The slightly lighter surface color for cards and panels.
- **Text (Body)**: `oklch(1 0 0)` — Pure white for maximum contrast on deep backgrounds.
- **Muted**: `oklch(0.6 0.015 255)` — Low-contrast text for secondary information.

## Typography

- **Body**: `Geist, system-ui, -apple-system, sans-serif` — Using Geist for modern readability, falling back to host OS native sans-serif.
- **Mono**: `Geist Mono, ui-monospace, SFMono-Regular, monospace` — Using Geist Mono for code snippets and technical text.

---
title: Gradion Book Illustration Studio Design Tokens
version: 1.0.0
colors:
  primary: "#FF6B00"
  primaryHover: "#E85F00"
  primaryLight: "#FFA861"
  primaryPale: "#FFC391"
  ink: "#231F20"
  inkBody: "#434343"
  inkMuted: "#595959"
  inkDisabled: "#919699"
  line: "#BAB7B1"
  paper: "#F2EEE7"
  paperAlt: "#F8F8F8"
  white: "#FFFFFF"
  black: "#1D1C1D"
typography:
  fontFamily: "Noto Sans, system-ui, sans-serif"
  sizeHeading2: "32px"
  sizeHeading3: "24px"
  sizeHeading4: "18px"
  sizeBody: "16px"
  sizeMeta: "12px"
rounded:
  card: "16px"
  button: "8px"
  pill: "999px"
shadows:
  card: "0 2px 6px rgba(35,31,32,0.06), 0 1px 2px rgba(35,31,32,0.04)"
---

# Gradion Design Tokens & UI Guidelines

This document serves as the machine-readable and human-readable design system reference for the **Book Illustration Studio**.

## Color Tokens & Palette
- **Brand Primary:** Gradion Orange (`#FF6B00`), with hover state (`#E85F00`).
- **Surface / Backgrounds:** 
  - Main background: Paper Alt (`#F8F8F8`).
  - Card background: Paper (`#F2EEE7`).
  - Input & Modal background: White (`#FFFFFF`).
- **Typography & Text:**
  - Ink (`#231F20`) for headings and primary titles.
  - Ink Body (`#434343`) for main content text.
  - Ink Muted (`#595959`) for subtext and captions.

## Component Styling Standards
- **Buttons (`.gd-btn`):** Rounded 8px, font-weight 600, smooth hover transition.
- **Cards (`.gd-card`):** Rounded 16px, background `#F2EEE7`, subtle border `#BAB7B1`.
- **Status Pills (`.gd-pill`):** Fully rounded pill (999px), uppercase bold text 12px.
- **Steppers:** Circle badges (28px x 28px), orange for current, dark ink for completed (✓), gray line for pending.

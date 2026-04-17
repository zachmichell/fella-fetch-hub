---
name: design-tokens
description: Boho Rainbow visual system — Fraunces/DM Sans, soft camel accent, six brand colors for KPIs, dark warm sidebar
type: design
---
# Boho Rainbow

**Fonts:** Fraunces (serif, 600/700) headings. DM Sans (400–700) body/UI.

**Type scale:** h1 = Fraunces 700 24px. Card title = Fraunces 600 16px. Body = DM Sans 13–14px. Labels = DM Sans 600 10–11px uppercase, tracking 0.08em (`.label-eyebrow`).

**Surfaces:**
- page bg #F0E6E0
- surface/card #F8F2EE
- border #E0D4CC
- border-subtle #E8DCD6

**Text:** primary #362C26, secondary #6E5E54 (`text-text-secondary`), tertiary #9E8E82 (`text-text-tertiary`).

**Accent — Soft Camel:** primary #CBA48F, light #F2E6DE, hover #B8927C. Tokens: `bg-primary`, `bg-primary-light`, `hover:bg-primary-hover`. Active text on camel = #2A1E16.

**Status:** success #6E9468/#D4E0D2, warning #B8860B/#FFF8E7, danger #C4302B/#FEF0EF, teal (Frosted Glass) #7E9EA2/#D6DEE0, plum #7B3F7D/#F8F0F8.

**Brand palette (KPI accent bars):** `brand-cotton` #F2D3C9 on `brand-cotton-bg` #F4E6E0, `brand-vanilla` #EED4BB on `brand-vanilla-bg` #F0E6DA, `brand-frost` #CBD5D6 on `brand-frost-bg` #E4EAEA, `brand-mist` #C7D0C5 on `brand-mist-bg` #E4EAE2. Plus `brand-blueberry` #CDB5B1, `brand-camel` #CBA48F.

**Sidebar:** dark warm #3C302A, text #D4C4B8, active = Soft Camel bg + #2A1E16 text, 250px wide.

**Radii:** card 14px (`rounded-lg`), button/input 10px (`rounded-md`), pill 20px (`rounded-pill`).

**Shadow:** card = `0 1px 3px hsl(24 18% 18% / 0.06)` exposed as `shadow-card`.

**Spacing:** 8px grid. Page padding 24px 32px. Card padding 18px 20px. Card gap 16px.

**Dashboard greeting:** "Good morning/afternoon/evening, {first_name}" as h1, date + summary below.

**KPI cards:** 4px left accent bar using a brand color, card bg = matching `*-bg` tint. Each of the 4 cards uses a distinct brand color (cotton, vanilla, frost, mist).

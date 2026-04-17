---
name: design-tokens
description: Direction B visual system — Fraunces/DM Sans, warm cream + terracotta, sidebar palette, status colors, card and table styling
type: design
---
# Direction B — Warm + Brand-Led

**Fonts:** Fraunces (serif, 600/700) for all headings. DM Sans (400–700) for body/UI. Imported in src/index.css from Google Fonts.

**Type scale:** h1 = Fraunces 700 24px. Card title = Fraunces 600 16px. Body = DM Sans 13–14px. Labels = DM Sans 600 10–11px uppercase, tracking 0.08em (use `.label-eyebrow` class).

**Surfaces:**
- page bg `#FDF8F4` (HSL 28 50% 97%)
- surface/card `#FFFFFF`
- border `#E8DDD4`
- border-subtle `#F2EBE4`

**Text:** primary `#2D1F14`, secondary `#6B5B4E` (`text-text-secondary`), tertiary `#A99888` (`text-text-tertiary`).

**Accent (terracotta):** primary `#C4572A`, light `#FEF0EB`, hover `#A84821`. Tokens: `bg-primary`, `bg-primary-light`, `hover:bg-primary-hover`.

**Status:** success `#2D7A4F`/light `#EEFBF3`, warning `#B8860B`/`#FFF8E7`, danger `#C4302B`/`#FEF0EF`, teal (reserved) `#1A7F6D`/`#EFFAF7`, plum (boarding) `#7B3F7D`/`#F8F0F8`. All exposed as Tailwind colors.

**Sidebar:** dark `#2D1F14`, text `#D4C4B6`, active = terracotta bg + white text, 250px wide.

**Radii:** card 14px (`rounded-lg`), button/input 10px (`rounded-md`), pill 20px (`rounded-pill`).

**Shadow:** card = `0 1px 3px hsl(24 36% 13% / 0.06)` exposed as `shadow-card`.

**Spacing:** 8px grid. Page padding 24px 32px. Card padding 18px 20px. Card gap 16px.

**Dashboard greeting:** "Good morning/afternoon/evening, {first_name}" as h1, date + summary below. Use `greeting()` helper from `src/lib/timezones.ts`.

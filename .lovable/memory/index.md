# Project Memory

## Core
fella-fetch — multi-tenant B2B SaaS for pet-care businesses (daycare + boarding v1.0; grooming/training/retail gated). Pilot Saskatoon, SK.
Visual: Direction B. Page bg #FDF8F4, text #2D1F14, terracotta accent #C4572A, dark sidebar #2D1F14.
Fonts: Fraunces (headings, 600/700) + DM Sans (body, 400–700). Never use Playfair/Inter.
Stack: React + Vite + Supabase (Auth, Postgres, Storage). Stripe Connect Standard + Billing planned.
Money = integer cents. All timestamps UTC, display in `locations.timezone` (default America/Regina). Soft deletes via `deleted_at`.
RLS uses `public.is_org_member(org_id)` SECURITY DEFINER helper — never query `memberships` directly inside policies.
Auth: Always set up `onAuthStateChange` before `getSession()`. Defer Supabase calls inside the listener with `setTimeout(..., 0)`.

## Memories
- [Design system](mem://design/tokens) — Direction B tokens: warm cream + terracotta, Fraunces/DM Sans, sidebar palette, status colors
- [App structure](mem://features/structure) — Tenancy, auth, onboarding, portal layout, routing

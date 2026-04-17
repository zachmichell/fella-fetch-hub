---
name: app-structure
description: Multi-tenant B2B SaaS for pet care — staff portal, owner portal, routing, RLS pattern, and key folders
type: feature
---
# fella-fetch app structure

## Product
Multi-tenant B2B SaaS for pet-care businesses (daycare + boarding for v1.0; grooming/training/retail gated). Staff portal first, owner portal second.

## Tenancy
- Every tenant table has `organization_id`.
- RLS uses `public.is_org_member(_org_id)` + `public.current_org_id()` SECURITY DEFINER helpers (avoids recursion through `memberships`).
- Roles: owner, admin, manager, staff (staff portal); customer (owner portal).

## Auth
- Supabase email/password + magic link.
- `handle_new_user` trigger auto-creates a `profiles` row from `auth.users.raw_user_meta_data` (first_name, last_name).
- Auth state in `src/hooks/useAuth.tsx` — exposes `{ user, profile, membership, loading, refresh, signOut }`. **Always** sets up `onAuthStateChange` BEFORE `getSession()`, defers Supabase reads with `setTimeout(..., 0)`.

## Routing (src/App.tsx)
- `/login`, `/signup` — public
- `/onboarding` — protected with `requireOrg={false}` (must be authed but no membership yet)
- `/dashboard` + all portal routes — protected, redirect to `/login` if no user, `/onboarding` if no membership
- `/` — `Index.tsx` smart redirect based on auth+membership state

## Onboarding (src/pages/onboarding/Onboarding.tsx)
3 steps in one component. On step 1 submit: creates organizations + memberships(owner) + locations + subscriptions(trialing, trial_ends_at = +30d). Step 2 updates the location. Step 3 = confirmation → dashboard.

## Portal layout
`src/components/portal/PortalLayout.tsx` wraps pages with the dark sidebar (`Sidebar.tsx`). Sidebar nav: Overview (Dashboard, Schedule), Operations (Pets, Owners, Reservations, Invoices), Facility (Playgroups, Kennel Runs), Settings.

## Money & dates
- All money stored as integer cents (`base_price_cents`, etc.). Display: `(v/100).toFixed(2)`.
- All timestamps UTC; display in `locations.timezone` (default `America/Regina`).
- Soft deletes: every table has `deleted_at`. Filter `WHERE deleted_at IS NULL`.

## Stub pages
`/schedule`, `/pets`, `/owners`, `/reservations`, `/invoices`, `/playgroups`, `/kennel-runs`, `/settings` all use the shared `ComingSoon` component inside `PortalLayout`.

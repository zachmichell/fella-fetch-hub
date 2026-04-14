

# Pawsitive Connect — Implementation Plan

## Phase 1: Foundation & Public Website (Start Here)

### Design System Setup
- Update Tailwind config with brand colors (#F5F0EB background, #2C2A27 charcoal text, warm beige accents)
- Add Playfair Display (headings) and Inter (body) via Google Fonts
- Define consistent card styles, spacing, and button variants

### Navigation & Footer
- Persistent header with links: STAY | GROOM | TRAIN | PLAY | SHOP | MY PORTAL button | BOOK NOW (dark filled)
- Subtle "Staff" link at far right
- Footer with business info, copyright, and links to FAQ, Policies, Privacy, Terms

### Homepage
- Hero with heading "Where Every Tail Wags With Joy", subtext, and two CTAs
- Service icon grid (4 icons: house, scissors, whistle, paw)
- Service cards section
- About/trust section with value propositions

### Service Pages (4 pages)
- `/services/daycare` (PLAY) — with "(launching soon)" note on report cards
- `/services/boarding` (STAY) — suite options
- `/services/grooming` (GROOM) — packages
- `/services/training` (TRAIN) — programs

### Static Pages
- `/contact` — form + business contact info
- `/faq`, `/policies`, `/privacy`, `/terms` — styled placeholders with real content
- `/shop` — "Coming Soon" placeholder

## Phase 2: Database & Booking Wizard

### Supabase Schema
- Create tables: profiles, pets, bookings, staff, suites, grooming_questionnaires
- Enable RLS — clients access own data only, staff access all
- User roles stored in separate table per security best practices

### Booking Wizard (multi-step, manual "Continue" advancement)
1. Select Service → 2. Select Pet → 3. Select Staff → 4. Day Type → 5. Date & Time → 6. Confirmation
- Stores booking in Supabase with pending status

## Phase 3: Client Portal

- Supabase Auth (email/password) login & signup
- Dashboard: upcoming bookings, pet profiles (CRUD), booking history, account settings
- All dates displayed in America/Regina timezone

## Phase 4: Staff Portal

- PIN-based entry with 3 access levels (admin, manager, basic)
- Control Center dashboard, Bookings management, Client list
- Grooming Calendar with pending questionnaires
- Lodging/Suites grid, Report Cards placeholder, Analytics placeholder

---

**Starting with Phase 1** as requested — homepage, nav, footer, and all service pages. Phase 2–4 will follow iteratively.


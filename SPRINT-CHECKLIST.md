# Dental Clinic Management System — Sprint Checklist

This is the single source of truth for sprint progress. Update this file whenever a task is started, completed, reworked, or blocked.

**Last updated:** 2026-10-30  
**Current sprint:** Sprint 8 — Web testing and production readiness  
**Status:** Staff booking now checks dentist and patient time conflicts before save, and each appointment can show its status history. The public contact form stores a message for the clinic inbox once `20261030190000_contact_messages.sql` is applied. Billing can add an installment schedule, and a covering payment marks the next unpaid installment paid. Android deployment and production Site URL confirmation stay last. Live acceptance, patient RLS execution, and the one-day reminder schedule remain pending.

## Status key

- [x] Done and verified
- [~] Implemented/prepared, but still needs integration or acceptance verification
- [ ] Not started
- [!] Blocked or needs a decision

## Sprint 1 — Project setup and public landing page

- [x] Inspect and retain the existing Ionic Vue + TypeScript + Vite + Capacitor project.
- [x] Establish responsive dental-clinic colors, typography, and base styling.
- [x] Build the public landing page in `src/views/HomePage.vue`.
- [x] Add reusable navigation, hero, services, about, gallery, dentist, benefits, testimonials, contact, footer, and image-placeholder components.
- [x] Add an image placeholder/fallback for every requested landing image area.
- [x] Make navigation responsive and use Ionic Vue components for the UI.
- [x] Validate production build and lint.
- [x] Check mobile-width and desktop-width layouts for horizontal overflow.
- [~] Landing contact details and map use a school-demo clinic on J.P. Rizal Street, Calapan City, Oriental Mindoro. Testimonials and gallery images are still sample content.
- [~] Connect the contact form to the clinic inbox (`/admin/messages`, `/superadmin/messages`) through `submit_contact_message`; apply `20261030190000_contact_messages.sql` and live-test before marking done. Placeholder phone, email, address, hours, map, and testimonials still need clinic-approved content.

## Sprint 2 — Authentication and navigation

- [x] Add the Supabase JavaScript client and environment example.
- [x] Ignore local `.env` files; keep the service-role key out of frontend configuration.
- [x] Configure Supabase URL, public anon key, and authentication session persistence.
- [x] Build login, patient registration, forgot-password, and reset-password pages with validation and visible errors.
- [x] Implement database profile/membership lookup for role-aware login.
- [x] Add role-specific redirect targets, protected route guards, and guest-only route behavior.
- [~] Add self-service profile editing for all roles (name/contact, email, password, private profile picture); migration `20261025230000_profile_self_service.sql` must be applied and live-tested.
- [x] Add shared role layouts, desktop side navigation, mobile bottom navigation, and sign out.
- [x] Fix sign out to end the current browser session without depending on remote global revocation; show pending state and report errors.
- [x] Ensure dashboard route layouts render as Ionic pages; add mocked-login Cypress regression test proving the dashboard displays immediately without a reload.
- [x] Add labeled placeholders for future dashboard pages instead of claiming unfinished modules are implemented.
- [x] Configure `npm run dev` to use Ionic CLI (`ionic serve`) and verify the app responds at `http://localhost:8100`; update Cypress base URL to match.
- [x] User confirmed Supabase Site URL is `http://localhost:8100` and `/login`, `/reset-password` redirect URLs are updated.
- [x] Verify Supabase Auth endpoint connectivity using the configured environment without displaying credentials.
- [x] Verify role redirects, cross-role route denial, validation, responsive layout, and browser console in a mocked-Supabase browser test.
- [~] Verify registration, login, reset-password email, and persisted session against the actual Supabase project after the migration and owner setup.
- [ ] Confirm matching production Site URL and redirect URLs when the app is deployed.

## Sprint 3 — Database and security

- [x] Prepare version-controlled migration `supabase/migrations/20261020160000_clinic_core.sql`.
- [x] Include all planned core entities: profiles, clinics, clinic memberships, patients, dentists, services, appointments, appointment history, queues, dental records, odontograms, clinical notes, treatment plans/items, invoices/items, payments/installments, inventory/items/transactions, patient files, notifications, and audit logs.
- [x] Add foreign keys, constraints, indexes, timestamps, appointment conflict constraints, inventory stock safeguards, and confirmed-payment safeguards.
- [x] Enable RLS and add policies for all 23 public application tables.
- [x] Add database-side patient-role signup/profile trigger, audit triggers, and a private `patient-files` Storage bucket with access policies.
- [x] Add setup/verification documentation and first-owner bootstrap instructions.
- [x] Parse the migration with a PostgreSQL parser; check all 23 tables have RLS and policy coverage.
- [x] User confirmed the target project is fresh and has no existing app tables or production data.
- [x] User confirmed the target project is fresh and has no existing app tables or production data; no existing app data needed backup.
- [x] Link the authenticated Supabase CLI to the confirmed target project.
- [x] Apply migration `20261020160000_clinic_core.sql` to Supabase and confirm it completes successfully.
- [x] Bootstrap the first clinic and superadmin using the documented trusted SQL procedure.
- [x] Receive the user's chosen owner email address; do not store it in this checklist or create fake credentials.
- [x] Confirm the owner account exists and its email is verified before bootstrap.
- [x] User confirmed owner login succeeds and redirects to the superadmin dashboard.
- [x] Verify remotely that all 23 expected application tables have RLS enabled, no expected table is missing RLS, and `patient-files` is private.
- [ ] Verify new patient signup receives a profile, clinic membership, and patient record.
- [~] Prepare a rollback-only SQL verification script for patient RLS, Storage object isolation, clinical notes, and audit-log permissions (`supabase/tests/patient_rls_isolation.sql`); run it against synthetic test fixtures before marking verified.
- [x] Generate `src/types/database.types.ts` from the applied Supabase schema and type the Supabase client.
- [~] Add a repeatable patient RLS verification script (`supabase/tests/patient_rls_isolation.sql`); PostgreSQL execution with representative test fixtures is pending.

## Sprint 4 — Admin and front desk

- [~] Implement patient registration, profile editing, paginated name search, portal/walk-in filtering, duplicate checks, and appointment/treatment history views; needs live acceptance testing in the signed-in app.
- [~] Appointment calendar with day/week/month/planner views, dentist filter, quick date jump, create/reschedule/cancel/confirm/complete/no-show actions, status colors, and DB-backed conflict messages (`/admin/appointments`, `/superadmin/appointments`); mocked calendar coverage added, needs live testing. Remote test data: 5 services seeded; accounts exist for owner, admin, dentist, and patient.
- [~] Backend appointment conflict handling and status history: exclusion constraints and the status-history trigger already exist; the staff calendar now blocks overlapping dentist or patient times before save and can show each appointment's status history. Needs live testing.
- [~] Queue management: check in today's appointments, auto queue numbers, waiting/in-session/done updates (finishing marks the appointment completed), remove from queue (`/admin/queue`, `/superadmin/queue`); needs live testing.
- [~] Invoice generation and itemized charges (draft, line items from services, discount, issue, void) in `/admin/billing` and `/superadmin/billing`; needs live testing.
- [~] Manual cash payments, plus a school-demo GCash, card, and bank checkout on staff billing and the patient payment page. No real charge is made. Patient checkout needs `20261030200000_demo_patient_payment.sql`. Staff can add an installment schedule, and a covering payment marks the next unpaid installment paid. Needs live testing.
- [~] Print-friendly receipt (opens a printable window); needs live testing.
- [~] Inventory item management, stock in/out transactions (DB rejects negative stock), low-stock alerts, archive, and per-item transaction history (`/admin/inventory`, `/superadmin/inventory`); mocked browser coverage verifies transaction history, but live testing remains.
- [~] Front desk dashboard with today's appointments, pending confirmations, queue counts, unpaid invoices/outstanding balance, low-stock alert, and next appointments (`/admin/dashboard`); needs live testing.
- [ ] Validate role permissions and clinic boundaries for each admin workflow.

## Sprint 5 — Dentist features

- [~] Dentist dashboard for today's appointments, upcoming patients, and current queue (`/dentist/dashboard`; needs live testing).
- [~] Dentist's private calendar (`/dentist/calendar`) with day/week/month views, quick date jump, and server query filtered to the signed-in dentist; mocked browser test added, live testing pending.
- [~] Interactive adult (1-32) and primary (A-T) odontogram with accessible labels and legend (`/dentist/patients/:id`).
- [~] Persist and load odontogram conditions for the selected patient.
- [~] Clinical diagnosis, procedure, observation, recommendation, and follow-up records, plus shareable clinical notes; mocked browser test verifies dentist chart history display and trimmed clinical record creation.
- [~] Private X-ray/document upload with type/size validation, progress indicator, signed-URL preview, and RLS/Storage-based access (`/dentist/x-rays`); needs live testing.
- [~] Multi-session treatment plans with per-procedure progress updates (planned / in progress / completed / cancelled).
- [x] Verify dentists can only access assigned patients and appropriate clinical data (SQL RLS check against remote: unassigned patient/odontogram hidden from the dentist; patient sees only self; test data rolled back).
- [~] Prepare rollback-only patient Storage-object and metadata isolation checks in `supabase/tests/patient_rls_isolation.sql`; execute with synthetic test fixtures.

## Sprint 6 — Patient portal

- [~] Patient dashboard with appointments, treatment summary, outstanding balance, and notices (`/patient/dashboard`).
- [~] Appointment request with availability (free-slot picker from busy-slot RPC), status, and 24-hour-rule cancellation via `cancel_my_appointment`; rescheduling = cancel + rebook (migration `20261022170000_patient_portal.sql`, applied). Mocked browser tests verify cancellation is offered only more than 24 hours ahead and that availability failures block booking until a successful retry; a successful booking uses the service duration and excludes overlapping slots.
- [~] Patient treatment history, dental chart (read-only), recommendations, shared notes, and follow-up information.
- [~] Patient invoice, confirmed-payment, balance, and installment history (draft invoices hidden); mocked browser test verifies confirmed-payment balance math and void invoices display zero balance.
- [~] In-app notification list and read state; update errors are shown and notices remain unread when the update fails. Mocked browser test verifies failure/retry behavior.
- [x] Require patients to complete personal profile details before accessing patient workflows: incomplete accounts are redirected to `/profile` immediately after login and before appointment/payment/portal routes.
- [~] One-day appointment reminder function `app_private.queue_appointment_reminders()` (tested; creates one reminder per appointment 24-48h ahead). NOT scheduled yet — needs pg_cron or an Edge Function.
- [ ] Implement push notifications only if provider configuration and Android permissions are available.
- [~] Verify patient access to records, invoices, files, notes, and Storage objects with `supabase/tests/patient_rls_isolation.sql`; script is prepared but requires fixture-backed database execution.

## Sprint 7 — Super Admin / clinic owner

- [~] Owner dashboard with patient counts, active staff, clinic-timezone-aware today’s appointments and month revenue, outstanding balance, open invoices, and low-stock alerts (`/superadmin/dashboard`).
- [~] Clinic-timezone-aware confirmed-payment revenue and six-month operational reporting for service popularity, dentist activity, and appointment outcomes (`/superadmin/analytics`); live-data acceptance remains.
- [~] Audit log viewer for recent clinic actions (`/superadmin/audit-logs`); mocked browser coverage verifies actor, entity, record ID, and metadata rendering.
- [~] Secure staff role assignment and deactivation in-app (`/superadmin/staff`, owner-only RPCs `list_clinic_accounts` / `set_staff_role`, applied to remote; cannot change self or owner). Accounts are still created via `/register`; direct creation with a temporary password is not built. Promoting to admin/dentist removes the auto-created patient record (or just unlinks it if it already has history); setting back to patient recreates it. Needs live testing.
- [ ] Verify ordinary staff cannot escalate roles or modify audit history.

## Sprint 8 — Web testing and production readiness (Android last)

- [ ] Test the complete workflows for every role.
- [~] Mocked browser regression for owner dashboard, analytics, audit logs, owner route redirection, patient profile-completion gate, patient payments, appointment cancellation/availability, notification read-state failure/retry, dentist clinical record creation, calendar navigation, and profile editing; live account acceptance and database role/RLS checks remain.
- [ ] Test CRUD behavior and database permissions for each feature.
- [ ] Test booking conflicts, invoice totals, partial payments, and stock boundaries.
- [ ] Test mobile, tablet, portrait, and landscape layouts; keyboard and system-back behavior.
- [ ] Review loading, empty, offline, and recoverable error states.
- [x] Fix final build, type-check, lint, and runtime issues (full `npm run lint`, `npm run build`, and all 10 mocked Cypress tests pass; re-run after future changes).
- [ ] Verify the web deployment and production auth redirect URLs.

### Android — GitHub Actions APK

- [x] Add the Capacitor Android project in `android` (`com.harbordental.clinic`, Harbor Dental).
- [~] GitHub Actions workflow `.github/workflows/android.yml` builds a debug APK after `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are saved as repository secrets. The APK artifact still needs a successful Actions run and install on a phone. Android Studio is optional.

## Current handoff

The migration has been applied successfully to the user-confirmed fresh project. Remote verification confirmed all 23 expected public application tables exist with RLS enabled, none is missing RLS, and the `patient-files` bucket exists and is private. The confirmed owner account was bootstrapped into the default clinic `Harbor Dental` (`Asia/Manila`) with active `superadmin` profile and membership; the user confirmed owner login reaches the superadmin dashboard. A pre-existing Auth account had no profile row because it was created before the migration; the bootstrap safely created that profile. Setup documentation now covers this case. Remote TypeScript database types are generated and used by the client. Still verify new patient registration and the documented RLS/Storage negative-access checks. Sprint 4 patient management code is implemented but requires acceptance testing in the signed-in app. Dashboard parent layout now has an Ionic `ion-page` root; the Cypress mocked-login navigation regression confirms the dashboard content renders immediately after `router.replace` without a browser reload.

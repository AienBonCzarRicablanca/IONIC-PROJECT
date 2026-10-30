# Harbor Dental

Ionic Vue + TypeScript dental clinic application with Supabase authentication, PostgreSQL, and Capacitor.

## Local development

1. Copy `.env.example` to `.env` and set the Supabase project URL and **publishable/anon key only**.
2. In Supabase Authentication → URL Configuration:
   - Set the Site URL to `http://localhost:8100` for `ionic serve`.
   - Add `http://localhost:8100/login` and `http://localhost:8100/reset-password` as redirect URLs.
   - Add the matching production URLs when deploying.
3. Apply the database migration and bootstrap the clinic owner using [docs/supabase-setup.md](./docs/supabase-setup.md).
4. Run:

   ```powershell
   npm install
   npm run dev
   ```

The `dev` script runs the Ionic CLI, which serves this Ionic Vue/Vite app at `http://localhost:8100`.

The `.env` file is git-ignored. Never put a Supabase service-role key in frontend configuration.

## Android APK from GitHub

The Android project is the `android` folder, created with Capacitor. GitHub Actions builds a debug APK. Android Studio is not required for that build.

1. Create an empty GitHub repository. Do not add a README there if this folder already has one.
2. In that repository, open Settings → Secrets and variables → Actions and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   Use the same public values as `.env`. Do not add the service-role key.
3. From this folder, commit and push. Confirm `git status` does not list `.env`.
4. Open the Actions tab, run **Android APK**, and download the `harbor-dental-debug` artifact.
5. Copy the APK to an Android phone and allow install from that source. This is a debug build for the school demo, not a Play Store release.

A push to `main` or `master` starts the same build. Local sync, after Android Studio is installed, is `npm run android:sync`.

## Database changes

SQL migrations are version-controlled in `supabase/migrations/`. The first migration creates the clinic schema, auth profile trigger, Row Level Security policies, audit triggers, appointment-conflict constraints, inventory safeguards, and the private `patient-files` Storage bucket.

Review [the Supabase setup guide](./docs/supabase-setup.md) before applying it to a project containing data. It includes a first-owner bootstrap procedure and verification queries.

The authenticated UI and feature pages are being delivered in sprints. Pages outside the completed sprint are explicitly shown as placeholders; they are not backed by CRUD operations yet.

Track completed and pending work in the single [sprint checklist](./SPRINT-CHECKLIST.md). Update it whenever sprint work changes.

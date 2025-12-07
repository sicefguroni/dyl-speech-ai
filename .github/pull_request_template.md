## Summary
Sets up the foundational infrastructure for Synapse, including the Supabase connection, Database Schema with Vector support, and the Next.js Authentication flow.

## Related Issue
Link the issue this PR solves (if any).

## Type of Change
- [x] 🚀 New feature (non-breaking change which adds functionality)
- [ ] 🛠️ Bug fix (non-breaking change which fixes an issue)
- [ ] ❌ Breaking change (fix or feature that would cause existing functionality to not work)
- [ ] 🧹 Refactoring (no functional changes, no api changes)
- [ ] 🏗️ Build configuration/Scripts

## Key Changes
- **Database:** Enabled `pgvector` and created `notes` table with RLS policies.
- **Middleware:** Added `apps/next/middleware.ts` to handle session refreshing.
- **Auth:** Implemented Server Actions for Login/Signup in `apps/next/app/login`.
- **Config:** Added strict TypeScript types for Supabase environment variables.

## How To Test
1. Pull the branch and run `npm install`.
2. Ensure `.env.local` has valid Supabase keys.
3. Run `npx tsx apps/next/scripts/verify-infrastructure.ts` to verify DB connection.
4. Go to `http://localhost:3000/login`.
5. Create a new account and verify you are redirected to `/`.

## Evidence (Before/After)
[Add Screenshots]

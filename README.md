# TR-Subscribe

Standalone Next.js app: newsletter subscribe UI + `POST /api/subscribe` → Beehiiv (no TR-Platform / Supabase dependency).

## Repo layout

This is its **own Git repository**, sibling to `TR-Platform`, not a subfolder inside it.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Deploy (Vercel)

New Vercel project → import **this** repo (root is repo root; no monorepo root directory). Set env vars from `.env.example`.

## Related

Marketing site and Supabase-backed subscribe flow live in **TR-Platform** separately.

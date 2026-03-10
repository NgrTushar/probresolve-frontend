# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project
ProbResolve — Next.js 15 frontend for a consumer complaint board for India.

## Stack
- Next.js 15 App Router, TypeScript, Tailwind CSS, SSR throughout
- No auth, anonymous-first

## Run
```bash
npm run dev
```

## Commands
```bash
npm run build      # Production build
npm run lint       # ESLint
npm test           # Vitest (run once)
npm run test:watch # Vitest watch mode
```

## Key facts
- `API_URL` = server-side fetches only (`lib/api.ts`)
- `NEXT_PUBLIC_API_URL` = client-side fetches (components)
- **Both must be set in `.env.local`** or subcategory dropdown breaks
- `amount_lost` is in rupees (₹)
- UUID is the real URL identity, slug is decorative SEO-only
- Server Action in `app/problems/new/actions.ts` handles form POST to backend

## Architecture
- **API client**: `lib/api.ts` — all server-side fetch calls; uses `API_URL`
- **Types**: `lib/types.ts` — TypeScript interfaces for all data shapes
- **Server components**: home page, problem detail, search — data fetched at render time
- **Client components**: `UpvoteButton`, `ReportButton`, `NewProblemForm`, `DomainTabs` — use `NEXT_PUBLIC_API_URL`
- **Server Action**: `app/problems/new/actions.ts` — form submission + file uploads (52MB body limit in `next.config.ts`)
- Tailwind CSS v4 (PostCSS-based config, not the legacy plugin approach)

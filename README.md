# ProbResolve — Frontend

Next.js frontend for ProbResolve — a consumer complaint board for India.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Testing | Vitest + React Testing Library |
| Node | 18+ |

---

## Prerequisites

- **Node.js 18+** (LTS recommended)
- The **backend** running locally at `http://localhost:8000` (see `probresolve-backend/README.md`)

---

## Local Setup

### 1. Clone & enter the directory

```bash
git clone <repo-url>
cd probresolve-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local   # if example exists, otherwise create manually
```

Create `.env.local` with:

```env
# Server-side only (used in Server Components & Server Actions)
API_URL=http://localhost:8000

# Client-side (used in Client Components — goes through CORS)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> For production, replace both values with your deployed backend URL (e.g. `https://api.probresolve.com`).

### 4. Start the dev server

```bash
npm run dev
```

The app is available at `http://localhost:3000`.

---

## Project Structure

```
app/
├── layout.tsx          # Root layout (fonts, metadata, global CSS)
├── page.tsx            # Home page — problem feed
├── globals.css         # Global styles + Tailwind base
├── problems/           # Problem detail pages
└── search/             # Search results page
components/             # Shared React components
lib/                    # Utility functions, API client helpers
public/                 # Static assets
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `API_URL` | ✅ | Backend base URL — used **server-side only** (Server Components, Server Actions). Never exposed to the browser. |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL — used **client-side** (Client Components). Exposed to the browser, so do not put secrets here. |

> In development both point to `http://localhost:8000`.  
> In production point both to your live backend URL.

---

## Running Tests

```bash
npm run test
```

Tests use Vitest + React Testing Library + happy-dom. See `vitest.config.ts` for configuration.

---

## Common Issues

**Blank page / no data**  
→ Make sure the backend is running (`uvicorn app.main:app --reload --port 8000`) and `API_URL` in `.env.local` matches.

**CORS errors in the browser console**  
→ The backend's `ALLOWED_ORIGINS` must include `http://localhost:3000`. Check `.env` in `probresolve-backend`.

**`npm install` fails**  
→ Make sure you are using Node 18+: `node -v`. Use `nvm use 18` if needed.
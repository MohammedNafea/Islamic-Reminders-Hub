# Islamic Reminders Hub

A comprehensive Islamic spiritual companion app with Adhkar (daily remembrances), Prayer Times, Tasbih, Qibla, Fasting tracker, Quran, Zakat calculator, and a searchable Hadith & Fiqh encyclopedia. Supports 30+ languages with full RTL support.

## Run & Operate

- `pnpm --filter @workspace/adhkar run dev` — run the Adhkar frontend (port 5173)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5002)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: see `.env.example` — `DATABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS v4, Framer Motion, Wouter
- API: Express 5 + Helmet + rate-limit + CORS
- DB: PostgreSQL + Drizzle ORM + Supabase
- Validation: Zod (`zod/v4`), `drizzle-zod`
- i18n: react-i18next, 30+ locales
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/adhkar/` — primary frontend application
- `artifacts/adhkar/src/i18n/locales/` — locale translation files (30+ languages)
- `artifacts/adhkar/src/data/` — static data (adhkar, fasting, hadith-rulings)
- `artifacts/api-server/src/` — Express 5 API server
- `lib/db/src/schema/` — Drizzle ORM schema (source of truth for DB)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)

## Architecture decisions

- **i18n-first**: All UI strings go through react-i18next; no hardcoded Arabic text in components
- **Offline-first**: Prayer times and adhkar work fully offline via localStorage
- **Supabase optional**: Cloud sync (favorites) gracefully degrades if env vars are missing
- **Monorepo**: pnpm workspaces with shared `lib/` packages to avoid duplication
- **RTL default**: `index.html` sets `lang="ar" dir="rtl"` by default; Layout updates dynamically

## Gotchas

- Always run `pnpm install` after pulling; workspace symlinks can break otherwise
- `pnpm --filter @workspace/db run push` requires a real `DATABASE_URL` — do not run in CI without one
- `VITE_SUPABASE_*` must start with `VITE_` to be exposed to the browser bundle
- LLM_Wiki scripts require optional deps (`pdfjs-dist`, `pdfplumber`) only if PDF extraction is needed

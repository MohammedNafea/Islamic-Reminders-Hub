# Islamic Reminders Hub (Monorepo)

A modern, high-performance Islamic application suite focused on Adhkar, Prayer Times, and spiritual productivity. Built with React 19, Tailwind CSS v4, and Express 5.

## Project Structure

This project is a monorepo managed by `pnpm` workspaces:

- `artifacts/adhkar`: The primary frontend application for Adhkar and Prayer Times.
- `artifacts/api-server`: Backend API server (Express 5).
- `artifacts/mockup-sandbox`: A sandbox environment for previewing UI components.
- `lib/db`: Database layer using Drizzle ORM and PostgreSQL.
- `lib/api-spec`: OpenAPI specifications and Orval configuration for API code generation.
- `lib/api-zod`: Shared Zod schemas for validation across frontend and backend.
- `lib/api-client-react`: Generated React hooks for API interaction.

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Framer Motion, Lucide React, Wouter.
- **Backend**: Node.js, Express 5, Pino (logging).
- **Database**: PostgreSQL, Drizzle ORM.
- **Development**: TypeScript 5.9, pnpm, Orval (codegen).

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (Recommended: 24+)
- pnpm 9.x+
- PostgreSQL (for backend)

### Installation

```bash
pnpm install
```

### Running the Apps

- **Adhkar Frontend**: `pnpm --filter @workspace/adhkar run dev`
- **API Server**: `pnpm --filter @workspace/api-server run dev`
- **Mockup Sandbox**: `pnpm --filter @workspace/mockup-sandbox run dev`

### Building the Project

```bash
pnpm run build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. Key variables:

- `DATABASE_URL`: PostgreSQL connection string (Required for DB/API).
- `VITE_SUPABASE_URL`: Supabase project URL (Required for auth & cloud sync).
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key.
- `PORT`: Port number for the servers (Defaults provided).
- `BASE_PATH`: Base URL path for Vite builds.

## Key Features

- **Adhkar Management**: Morning, Evening, Sleep, and Prayer adhkar with progress tracking.
- **Islamic Encyclopedia (Wiki)**: Automated knowledge ingestion pipeline extracting hadiths, fiqh, creed, and more from PDFs. Includes smart ruling categorization (`islamicRuling`) and language detection.
- **Prayer Times**: Precise calculations using the `adhan` library with city lookup.
- **Hijri Calendar**: Robust Hijri-Gregorian date conversion and calendar view.
- **Responsive Design**: Premium Islamic-themed UI with Dark Mode and RTL support.
- **High Performance**: Optimized bundling and modern React patterns.
- **Internationalization**: 30+ languages with complete translations.
- **Security**: Helmet headers, rate limiting, CORS restrictions, and env validation.
- **Cloud Sync**: Supabase-backed user favorites synchronization.

## Development Workflow

1. **Modify API Spec**: Update `lib/api-spec/openapi.yaml`.
2. **Generate Code**: Run `pnpm --filter @workspace/api-spec run codegen`.
3. **Database Changes**: Update schemas in `lib/db/src/schema/` and run `pnpm --filter @workspace/db run push`.

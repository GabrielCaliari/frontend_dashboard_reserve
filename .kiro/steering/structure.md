# Project Structure

## Directory Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages (login)
│   ├── dashboard/         # Dashboard pages and features
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── providers.tsx      # Client-side providers wrapper
│
├── common/                # Shared business logic
│   ├── @types/           # TypeScript type definitions
│   ├── actions/          # Server actions (Next.js server functions)
│   ├── config/           # Configuration files (API clients, error types)
│   ├── db/               # Static data files (JSON)
│   ├── hooks/            # React custom hooks
│   ├── schemas/          # Validation schemas (Zod/Yup)
│   ├── services/         # API service layer
│   ├── stores/           # Zustand state stores
│   └── utils/            # Utility functions
│
├── components/           # React components
│   ├── dropdow-menu/    # Dropdown menu components
│   ├── email-builder/   # Email builder components
│   ├── forms/           # Form components
│   ├── modals/          # Modal dialogs
│   ├── tables/          # Table components
│   └── ui/              # Reusable UI components
│
├── layout/              # Layout components
└── middleware/          # Next.js middleware

public/                  # Static assets (images, logos)
.kiro/                   # Kiro configuration
```

## Architecture Patterns

### Layered Architecture

1. **Pages (App Router)** - Route handlers and page components
2. **Actions** - Server-side functions marked with `'use server'`
3. **Services** - API communication layer
4. **Hooks** - React hooks for component logic
5. **Components** - Presentational components

### Data Flow

```
Page/Component → Hook → Action → Service → API
                   ↓
                 Store (Zustand)
```

### File Naming Conventions

- **Pages**: `page.tsx` (Next.js convention)
- **Components**: kebab-case (e.g., `email-campaign-table.tsx`)
- **Services**: kebab-case with `-service.ts` suffix
- **Actions**: kebab-case with `.tsx` extension (for 'use server')
- **Types**: kebab-case with `@` prefix (e.g., `@email-campaign.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useListLeads.ts`)
- **Schemas**: kebab-case with `-schema.ts` suffix

### Key Conventions

- Server actions are in `src/common/actions/` with `'use server'` directive
- API services use axios instances from `src/common/config/`
- Type definitions are centralized in `src/common/@types/`
- Validation schemas are in `src/common/schemas/`
- Feature-specific code is grouped by domain (e.g., `email-campaign/`, `smtp-server/`)
- Internationalization keys are accessed via `next-intl` with `getTranslations()`
- Dark theme is default (`className="dark"` on html element)
- Font: Nunito (Google Fonts) with CSS variable `--font-nunito`

### API Configuration

- Multiple API clients in `src/common/config/`
- Environment variables for API URLs (e.g., `NEXT_PUBLIC_API_EMAIL_URL`)
- Centralized error handling with error type constants

### State Management

- **Zustand stores** for global state (`src/common/stores/`)
- **React Query** for server state caching
- **React Hook Form** for form state

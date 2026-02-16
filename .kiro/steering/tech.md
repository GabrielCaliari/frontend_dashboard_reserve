# Technology Stack

## Framework & Runtime

- **Next.js 16.1.6** (App Router with React Server Components)
- **React 19.2.4** with React DOM
- **TypeScript 5.9.3** (strict mode enabled)
- **Node.js** (target: ES2017)

## UI Libraries

- **NextUI** - Primary component library
- **Radix UI** - Headless UI primitives (dialogs, dropdowns, selects, tabs, toast)
- **Tailwind CSS 3.4.16** - Utility-first styling
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **React Icons** - Additional icons

## State Management & Data Fetching

- **Zustand** - Global state management
- **React Query** - Server state management
- **React Hook Form** - Form state management
- **Axios** - HTTP client

## Form Validation

- **Zod** - Primary schema validation
- **Yup** - Alternative schema validation
- **@hookform/resolvers** - Form validation integration

## Specialized Features

- **@udecode/plate** - Rich text editor
- **@usewaypoint/email-builder** - Email template builder
- **@dnd-kit** - Drag and drop functionality
- **Chart.js & Recharts** - Data visualization
- **next-intl** - Internationalization
- **jspdf & pdf-lib** - PDF generation

## Development Tools

- **ESLint** - Code linting with TypeScript, React, and Next.js plugins
- **Prettier** - Code formatting
- **Turbopack** - Fast development bundler

## Common Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack

# Production
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint with auto-fix
```

## Build Configuration

- TypeScript build errors are ignored in production (`ignoreBuildErrors: true`)
- Package imports are optimized for: NextUI, Lucide, React Icons, Recharts, DND Kit, Framer Motion
- Path alias: `@/*` maps to workspace root

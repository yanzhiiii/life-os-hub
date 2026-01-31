# Life OS - All-in-One Productivity & Finance Web App

## Overview

Life OS is a comprehensive personal management application combining productivity tools, financial tracking, journaling, and insights into a unified dashboard. The app provides multi-user accounts with private data isolation, allowing users to manage routines, tasks, goals, events, transactions, debts, savings goals, and journal entries all in one place.

Key features include:
- **Dashboard** with widgets for time, weather, upcoming tasks, and financial snapshots
- **Productivity** module for routines, tasks, and goal tracking with streaks
- **Calendar** for scheduling events and activities
- **Finance** module for income/expense tracking, debts, and savings goals
- **Journal** for daily entries with mood tracking
- **Insights** with charts and analytics across all modules

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

**Design Decisions**:
- Component-based architecture with reusable UI components in `/client/src/components/ui/`
- Custom hooks in `/client/src/hooks/` encapsulate all API interactions
- Protected routes redirect unauthenticated users to the auth page
- Shell layout component provides consistent sidebar navigation

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy (username/password)
- **Session Management**: Express-session with cookie-based sessions
- **Password Security**: Scrypt hashing with random salts

**Design Decisions**:
- RESTful API endpoints under `/api/` prefix
- Storage layer abstraction in `/server/storage.ts` for database operations
- Shared schema and route definitions in `/shared/` directory for type safety
- API contracts defined with Zod schemas for runtime validation

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `/shared/schema.ts`
- **Migrations**: Drizzle Kit with migrations in `/migrations/`

**Tables**:
- `users` - User accounts with payday configuration
- `routines` / `routine_completions` - Habit tracking with completion logs
- `tasks` - Todo items with priority, status, tags
- `goals` - Long-term objectives with milestones
- `events` - Calendar events
- `transactions` - Income/expense entries with categories
- `debts` - Debt tracking with interest rates
- `savings_goals` - Savings targets with progress
- `journal_entries` - Daily entries with mood

### Authentication Flow
1. User registers with username/password (password hashed with scrypt)
2. Login creates session cookie valid for 1 week
3. Protected routes check `req.isAuthenticated()` middleware
4. All data queries filter by authenticated user's ID

## External Dependencies

### Database
- **PostgreSQL** - Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle ORM** - Type-safe database queries and migrations
- **connect-pg-simple** - PostgreSQL session store

### UI Libraries
- **Radix UI** - Headless component primitives (dialog, dropdown, tabs, etc.)
- **Recharts** - Charting library for insights and dashboard
- **Embla Carousel** - Carousel component
- **date-fns** - Date formatting and manipulation

### Development Tools
- **Vite** - Frontend build and dev server with HMR
- **esbuild** - Server bundling for production
- **TypeScript** - Type checking across client/server/shared code

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - (Optional) Session encryption key, defaults to "secret"

## Recent Changes (January 2026)

### Frontend Pages Implemented
- **Calendar Page** (`/calendar`) - Month view with event creation and deletion, date navigation, day status tracking (Working Day, Rest Day, Sick Leave, Annual Leave, Custom)
- **Journal Page** (`/journal`) - Entry list with mood tracking (5 moods: happy, neutral, sad, excited, grateful), full CRUD
- **Insights Page** (`/insights`) - Charts for spending by category, income vs expenses, productivity completion rates, cross-module insights (mood vs spending, mood vs productivity, life balance radar)
- **Settings Page** (`/settings`) - Profile editing, currency selection, payday configuration, dark/light theme toggle with database persistence

### Enhanced Modules
- **Dashboard** - Dynamic salary countdown based on user's payday config, today's working status display, time-based greetings
- **Productivity Page** - Complete Routines tab with step tracking and daily completion logging; Goals tab with milestone tracking and progress visualization
- **Finance Page** - Calendar tab with enhanced UI featuring toggle buttons for status visibility (Working, Standby, Rest Day, Sick Leave, Annual Leave, Custom, Events), larger calendar cells with color-coded status indicators and event badges, integrated day status and events display, pay period analytics (days remaining, spent this period, daily average), pay period comparison chart; Debts tab with "breaking chains" visualization; Savings tab with "filling jar" visualization; Spending by Category pie chart with legend showing percentages
- **Calendar Page** - Day status system (Working Day, Standby, Rest Day, Sick Leave, Annual Leave, Custom) with color-coded calendar indicators, upcoming events timeline with "X days to go" labels, planning ahead capability for future dates

### New Database Tables
- `day_statuses` - Tracks working/rest/leave status per day with optional custom labels and colors

### New API Endpoints
- `PATCH /api/user/settings` - Update user settings (displayName, currency, paydayConfig)
- `GET/PUT /api/day-statuses/:date` - Get/upsert day status for a specific date
- `GET /api/day-statuses` - List all day statuses for current user

### New Hooks
- `use-events.ts` - Calendar event CRUD operations
- `use-goals.ts` - Goal and milestone management
- `use-day-statuses.ts` - Day status CRUD operations
- `use-user-settings.ts` - User settings persistence
- Extended routines hook with completion tracking

### Cross-Module Insights
- Average mood score card with trend indicator
- Mood vs Spending correlation chart
- Mood vs Productivity correlation chart
- Life Balance radar chart (finances, tasks, goals, routines, mood, savings)
- Weekly mood trend line chart

### Design Patterns
- All navigation links use `data-testid="nav-{page}"` format
- Tab triggers use `data-testid="tab-{tabname}"` format
- Theme toggle persists to localStorage
- Routine steps and goal milestones entered as newline-separated text, transformed to arrays on submit
- Currency formatting uses user's selected currency (PHP, USD, EUR, GBP, JPY)
- Day status buttons use `data-testid="button-status-{type}"` format
- Finance Calendar toggle buttons use `data-testid="toggle-status-{type}"` and `data-testid="toggle-events"` format
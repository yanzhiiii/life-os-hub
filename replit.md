# Life OS Hub - Personal Life Management System

## Overview

Life OS Hub is a personal operating system for life — a unified platform designed to help individuals manage time, finances, habits, goals, and personal growth in one place. Created by **Edric Kristian L. Gantes**, the application provides multi-user accounts with private data isolation.

**What "Life OS" Means**: Life Operating System — just as a computer's OS organizes hardware and software, Life OS Hub organizes the key domains of life: Time, Money, Energy, Habits, and Goals. It's about alignment, sustainability, and self-direction.

© 2026 Edric Kristian L. Gantes. All rights reserved.

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
- **Calendar Page** (`/calendar`) - Full month grid view with day cells showing work status, events, and status icons; event creation with date pre-population; day status tracking (Working Day, Standby, Rest Day, Sick Leave, Annual Leave, Custom); status legend
- **Journal Page** (`/journal`) - Entry list with mood tracking (5 moods: happy, neutral, sad, excited, grateful), full CRUD
- **Insights Page** (`/insights`) - **MAJOR UPDATE**: Now organized into 4 tabs (Overview, Finance, Productivity, Wellness) with comprehensive statistics:
  - **Overview Tab**: Key metrics cards (net balance, tasks done, goals progress, today's routines), This Month Summary (income, expenses, savings rate, daily avg spend), Life Balance radar, Quick Stats section
  - **Finance Tab**: Financial KPIs (total income, expenses, saved, debt), 6-month trend chart, spending by category pie chart, debt payoff and savings goal progress bars with individual goal breakdowns, top spending category highlight
  - **Productivity Tab**: Task completion rate, pending tasks, priority breakdown chart, weekly productivity bar chart, goals & milestones progress section, today's routine circular progress indicator
  - **Wellness Tab**: Mood statistics (avg score, journal count, most common mood), weekly mood trend line chart, mood distribution visualization, cross-module correlations (mood vs spending, mood vs productivity)
- **Settings Page** (`/settings`) - Profile editing, currency selection, payday configuration, dark/light theme toggle with database persistence

### Enhanced Modules
- **Dashboard** - Dynamic salary countdown based on user's payday config, today's working status display, time-based greetings; **NEW: Live clock** with real-time updating seconds; **NEW: Privacy toggle** to hide/show financial amounts (income, expenses, balance)
- **Productivity Page** - Complete Routines tab with step tracking and daily completion logging; Goals tab with milestone tracking and progress visualization; **NEW: Pomodoro Timer tab** with customizable work/break durations, visual circular progress, session tracking, and settings persistence
- **Finance Page** - **Projected Balance Calendar** feature (inspired by AntiGastador): baseline balance input with localStorage persistence; enhanced recurring templates with 9 frequency patterns (once, daily, weekly, biweekly, semimonthly variants, monthly, every N days); projected balance displayed per day (color-coded green/red); Payout Period Statistics section with income/expense/net breakdown and pie charts per period; Debts tab with "breaking chains" visualization; Savings tab with "filling jar" visualization; Spending by Category pie chart with legend showing percentages; **NEW: Privacy mode** - all amounts hidden by default (shows ****), toggle button to show/hide amounts for public browsing
- **Calendar Page** - Day status system (Working Day, Standby, Rest Day, Sick Leave, Annual Leave, Custom) with color-coded calendar indicators, upcoming events timeline with "X days to go" labels, planning ahead capability for future dates; **NEW: Paint mode** for quick bulk status assignment - select a status then click multiple days; **NEW: Quick event creation** via "+" button on each day cell (visible on selected day, hover for others) or double-click

### New Database Tables
- `day_statuses` - Tracks working/rest/leave status per day with optional custom labels and colors
- `recurring_templates` - Recurring expense/income templates with enhanced frequency patterns (once, daily, weekly, biweekly, semimonthly_1_15, semimonthly_5_20, semimonthly_15_eom, monthly, everyN), everyNDays field, note field, active status, and category

### Pomodoro Timer Features
- Customizable work duration (default 25 min), short break (5 min), long break (15 min)
- Sessions before long break (default 4)
- Visual circular progress indicator
- Session tracking with statistics (sessions today, minutes focused, cycles completed)
- Settings persistence in localStorage
- Mode switching (Focus/Short Break/Long Break)
- How-to-use guide

### New API Endpoints
- `PATCH /api/user/settings` - Update user settings (displayName, currency, paydayConfig)
- `GET/PUT /api/day-statuses/:date` - Get/upsert day status for a specific date
- `GET /api/day-statuses` - List all day statuses for current user
- `GET/POST/PATCH/DELETE /api/recurring-templates` - CRUD for recurring expense/income templates

### New Hooks
- `use-events.ts` - Calendar event CRUD operations
- `use-goals.ts` - Goal and milestone management
- `use-day-statuses.ts` - Day status CRUD operations
- `use-user-settings.ts` - User settings persistence
- `use-recurring-templates.ts` - Recurring expense/income template CRUD operations
- Extended routines hook with completion tracking

### Cross-Module Insights
- Average mood score card with trend indicator
- Mood vs Spending correlation chart
- Mood vs Productivity correlation chart
- Life Balance radar chart (finances, tasks, goals, routines, mood, savings)
- Weekly mood trend line chart

### Responsive Design (January 2026)
- **Mobile Navigation** (`MobileNav` component in Sidebar.tsx): Bottom navigation bar with 5 tabs (Home, Tasks, Calendar, Finance, More)
- **Mobile "More" Sheet**: Opens from bottom with access to Journal, Insights, Settings, About, and Sign Out
- **Adaptive Layouts**: All pages use responsive breakpoints (sm/md/lg) for grids, typography, and spacing
- **Calendar Grid**: Compact cells on mobile with dot indicators for events; full details on tablet/desktop
- **Tab Labels**: Shortened labels on mobile screens (e.g., "Transactions" → "Trans")
- **Copyright Footer**: Visible in sidebar on desktop, in "More" sheet on mobile

### Design Patterns
- All navigation links use `data-testid="nav-{page}"` format
- Mobile nav uses `data-testid="mobile-nav-{page}"` format
- Tab triggers use `data-testid="tab-{tabname}"` format
- Theme toggle persists to localStorage
- Routine steps and goal milestones entered as newline-separated text, transformed to arrays on submit
- Currency formatting uses user's selected currency (PHP, USD, EUR, GBP, JPY)
- Day status buttons use `data-testid="button-status-{type}"` format
- Finance Calendar uses `data-testid="button-add-recurring"` for adding recurring templates
- Recurring template items use `data-testid="recurring-{id}"` format
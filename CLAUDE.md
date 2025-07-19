# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FireGEO is an open-source SaaS starter template built with Next.js 15.3, TypeScript, and PostgreSQL. It includes authentication, billing, AI chat, and brand monitoring features out of the box.

## Essential Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Database Management
```bash
npm run db:generate  # Generate Drizzle migrations after schema changes
npm run db:migrate   # Apply pending migrations
npm run db:push      # Push schema changes directly (development only)
npm run db:studio    # Open Drizzle Studio GUI for database inspection
```

### Initial Setup
```bash
npm run setup        # Run automated setup (checks env, installs deps, sets up DB)
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3 (App Router), React 19, TypeScript 5.7, Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **Payments**: Autumn.js (Stripe integration)
- **AI Providers**: OpenAI, Anthropic, Google Gemini, Perplexity

### Key Architectural Patterns

1. **API Routes Structure**: All API endpoints are in `/app/api/` using Next.js route handlers:
   - Auth handled by Supabase client
   - Protected routes check session via Supabase auth
   - API wrapper utility in `lib/api-wrapper.ts` for consistent error handling

2. **Database Schema**: 
   - Auth tables managed by Supabase (auth.users, auth.sessions)
   - Custom tables defined in `/lib/db/schema/` using Drizzle ORM
   - Migrations in `/migrations/`

3. **Authentication Flow**:
   - Client-side: `lib/auth-client.ts` exports Supabase client and hooks
   - useSession() hook for session management
   - Middleware in `middleware.ts` protects routes

4. **AI Integration**:
   - Providers configured in `/lib/providers/`
   - Chat functionality in `/app/api/chat/route.ts`
   - Streaming responses using Vercel AI SDK

5. **Component Architecture**:
   - UI components in `/components/ui/` (shadcn/ui based)
   - Feature-specific components organized by domain
   - Client components marked with "use client"

### Important Implementation Details

1. **Environment Variables**: Always check `.env.example` for required variables. Database URL is mandatory.

2. **Database Changes**: 
   - Modify schema files in `/lib/db/schema/`
   - Run `npm run db:generate` to create migration
   - Run `npm run db:migrate` to apply

3. **Adding New API Routes**:
   - Create route handler in `/app/api/`
   - Use `apiWrapper` from `lib/api-wrapper.ts` for consistency
   - Check authentication with `auth.api.getSession()`

4. **AI Provider Integration**:
   - Add provider config in `/lib/providers/`
   - Update `getModelDetails` in `lib/ai-utils-common.ts`
   - Add API key to environment variables

5. **Billing Integration**:
   - Products defined in `/config/autumn-products.ts`
   - Webhook handler in `/app/api/autumn/webhook/route.ts`
   - Credit system managed via database

## Common Development Tasks

### Adding a New Feature
1. Create API route in `/app/api/[feature]/`
2. Add database schema if needed in `/lib/db/schema/`
3. Create UI components in `/components/[feature]/`
4. Add page route in `/app/[feature]/`

### Debugging Authentication
- Check session: `supabase.auth.getSession()`
- Client-side hooks: `useSession()` from `lib/auth-client.ts`
- Auth tables in Supabase: auth.users, auth.sessions

### Working with AI Chat
- Chat API: `/app/api/chat/route.ts`
- Conversation storage in database
- Provider switching handled automatically
- Credit deduction on message completion

## Testing Approach
The project doesn't have a test suite configured. When implementing tests:
- Consider adding Jest for unit tests
- Use Playwright for E2E tests
- Test database operations with a test database

## Important Notes
- Always run `npm run lint` before committing
- Database migrations are critical - never skip them
- Protected routes must check authentication
- AI API keys are provider-specific - ensure correct format
- Autumn webhook must be configured for billing to work
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quitedly is a private progress tracking platform built with Next.js 14 that helps individuals build sustainable habits through flexible, supportive structures. The platform offers three commitment modes (Free Flow, Gentle Rhythm, Committed Path) with optional anonymous community support.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS  
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI:** Vercel AI SDK (OpenAI integration)
- **Payments:** Stripe
- **Deployment:** Vercel + Supabase Cloud
- **PWA:** next-pwa for mobile app capabilities

## Common Development Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check

# Dependencies
npm install          # Install all dependencies
npm install <package> # Add new dependency (updates package.json)
```

## Architecture Overview

### Directory Structure
- `app/` - Next.js 14 App Router pages and API routes
  - `(auth)/` - Authentication route group (login, signup)
  - `api/` - API endpoints (chat, stripe webhooks)
- `lib/` - Core utilities and integrations
  - `supabase/` - Supabase client (browser) and server utilities
  - `stripe/` - Stripe client and server configuration
- `components/` - Reusable React components
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
  - `database.types.ts` - Supabase database types (generate with `supabase gen types`)

### Key Integration Points

**Supabase Authentication:**
- Server-side auth: Use `lib/supabase/server.ts`
- Client-side auth: Use `lib/supabase/client.ts`
- Middleware handles session refresh in `middleware.ts`

**AI Chat Integration:**
- Chat endpoint: `app/api/chat/route.ts`
- Uses Vercel AI SDK streaming responses
- Configured for OpenAI (extendable to other providers)

**Stripe Payments:**
- Webhook handler: `app/api/stripe/webhook/route.ts`
- Client-side: Load Stripe.js via `lib/stripe/client.ts`
- Server-side: Use Stripe instance from `lib/stripe/server.ts`

## GitHub Workflow & Development Process

### Repository Structure

```
main (production)
├── develop (integration branch)
│   ├── feature/[issue-number]-brief-description
│   ├── bugfix/[issue-number]-brief-description
│   └── hotfix/[issue-number]-brief-description
```

### Development Process

1. **Issue Creation**
   - Create issue in GitHub
   - Issues are auto-labeled based on content
   - Assigned to project board

2. **Branch Creation**
   ```bash
   # Comment on issue: /create-branch
   # Or manually:
   git checkout develop
   git pull origin develop
   git checkout -b feature/123-add-voice-notes
   ```

3. **Development**
   ```bash
   # Make changes
   git add .
   git commit -m "feat: add voice note recording capability"
   git push origin feature/123-add-voice-notes
   ```

4. **Pull Request**
   - Create PR to develop branch
   - PR template auto-fills
   - CI/CD runs automatically
   - Preview deployment created

5. **Review & Merge**
   - Code review required
   - All checks must pass
   - Squash merge to develop
   - Auto-deploy to staging

6. **Release Process**
   ```bash
   # Weekly releases from develop to main
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   # Auto-deploy to production
   # Auto-create release tag
   ```

### Commit Message Convention

```bash
# Format: <type>(<scope>): <subject>

feat(auth): add magic link login
fix(ui): correct button alignment on mobile
docs(api): update endpoint documentation
style(home): format code with prettier
refactor(db): optimize query performance
test(auth): add unit tests for login
chore(deps): update dependencies
```

### Branch Protection Rules

**`main` Branch:**
- Require PR reviews (1 minimum)
- Dismiss stale PR reviews
- Require status checks (CI/CD)
- Require branches to be up to date
- Include administrators
- Restrict who can push

**`develop` Branch:**
- Require PR reviews (1 minimum)
- Require status checks (CI/CD)
- Require branches to be up to date

## File Generation Guidelines

### Configuration and Dependency Files

When working with configuration files and dependency management files, **always use the appropriate CLI tools** to generate or update them. Never write these files from scratch.

**Required CLI Usage:**

1. **Package Management Files**
   - `package.json`: Use `npm init` or `npm install <package>` to modify
   - `package-lock.json`: Never edit manually, use `npm install`
   - `yarn.lock`: Never edit manually, use `yarn add`
   - `pnpm-lock.yaml`: Never edit manually, use `pnpm install`

2. **Framework Configuration**
   - `next.config.js`: Use `npx create-next-app` or copy from documentation
   - `tsconfig.json`: Use `npx tsc --init` or framework generators
   - `tailwind.config.js`: Use `npx tailwindcss init`
   - `.eslintrc.json`: Use `npx eslint --init`

3. **Other Config Files**
   - `.env` files: Create with proper tools or copy templates
   - `vercel.json`: Use `vercel init` or copy from documentation
   - `supabase/config.toml`: Use `supabase init`

**Example Workflow:**
```bash
# DON'T: Write package.json manually
# DO: Use proper commands
npm init -y
npm install next react react-dom
npm install -D @types/react typescript

# DON'T: Create tsconfig.json from scratch  
# DO: Let Next.js generate it
npx create-next-app@latest --typescript
# or
npx tsc --init
```
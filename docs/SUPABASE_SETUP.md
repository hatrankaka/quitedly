# Supabase Setup Guide

Follow these steps to set up Supabase for the Quitedly project:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - Project name: `quitedly`
   - Database password: (save this securely)
   - Region: Choose closest to your users
   - Pricing plan: Free tier is fine to start

## 2. Get Your API Keys

Once your project is created:

1. Go to Settings → API
2. Copy these values:
   - **Project URL**: `https://[your-project].supabase.co`
   - **Anon/Public Key**: (safe to use in browser)
   - **Service Role Key**: (keep secret, server-side only)

## 3. Configure Environment Variables

1. Copy the example env file:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your Supabase credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Other required variables
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add these later when you have them:
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# OPENAI_API_KEY=
```

## 4. Set Up Database Schema

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the sidebar
3. Copy the entire contents of `/supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the migration

### Option B: Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref [your-project-ref]
```
(Find your project ref in Settings → General)

4. Push the migration:
```bash
supabase db push
```

## 5. Configure Authentication

1. In Supabase Dashboard, go to Authentication → Providers
2. Ensure "Email" provider is enabled
3. In Authentication → Email Templates, customize if desired
4. In Authentication → URL Configuration, set:
   - Site URL: `http://localhost:3000` (for development)
   - Redirect URLs: Add `http://localhost:3000/auth/callback`

## 6. Enable Row Level Security (RLS)

Our migration already enables RLS, but verify:

1. Go to Database → Tables
2. For each table, ensure the shield icon is green (RLS enabled)
3. Click on each table → RLS Policies to see the policies we created

## 7. Test Your Setup

1. Start the development server:
```bash
npm run dev
```

2. Visit `http://localhost:3000`
3. Try signing up with an email
4. Check your email for confirmation (check spam folder)
5. Click the confirmation link
6. You should be redirected to the dashboard

## Troubleshooting

### "Invalid API Key" Error
- Double-check your `.env.local` file
- Make sure you're using the anon key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server after changing env variables

### Email Confirmation Not Working
- Check spam folder
- In development, you can disable email confirmation:
  - Go to Authentication → Providers → Email
  - Toggle off "Confirm email"

### Database Migrations Failed
- Make sure you're using the correct project
- Check SQL syntax if manually running
- Try running migrations one section at a time

## Next Steps

Once Supabase is set up:
1. Set up Stripe for payments (optional)
2. Add OpenAI API key for AI features (optional)
3. Deploy to Vercel for production
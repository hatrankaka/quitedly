# Quitedly

A private progress tracking platform that helps individuals build sustainable habits through flexible, supportive structures.

## Features

- 🎯 **Three Commitment Modes**: Free Flow, Gentle Rhythm, and Committed Path
- 🔒 **Privacy-First**: Your data stays private with optional anonymous community support
- 📱 **Multi-Platform**: Web, PWA, and native mobile apps
- 🤖 **AI-Powered Insights**: Smart habit stacking and progress analysis
- 💳 **Flexible Pricing**: Free tier with optional Pro features

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Vercel AI SDK (supports multiple providers)
- **Payments**: Stripe
- **Deployment**: Vercel + Supabase Cloud

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hatrankaka/quitedly.git
cd quitedly
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual values:
- Supabase URL and keys
- Stripe keys
- OpenAI API key
- App URL

4. Set up the database:
```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development

### Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
```

### Project Structure

```
quitedly/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── api/               # API routes
│   └── (dashboard)/       # Main app routes
├── components/            # React components
├── lib/                   # Utilities and integrations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── supabase/             # Database migrations
```

### Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our development process and how to submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
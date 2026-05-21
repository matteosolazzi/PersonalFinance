# Setup Guide — Personal Finance App

## Prerequisites
- Node.js 18+
- A Supabase project (free tier is enough)
- A Google Cloud project (for OAuth)
- A Vercel account
- (Optional) A Resend account for email notifications

## 1. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string**
3. Copy the **Transaction** URL (port 6543) → `DATABASE_URL`
4. Copy the **Session** URL (port 5432) → `DIRECT_URL` (used for migrations)

## 2. Google OAuth Setup
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google+ API** and **Google OAuth2 API**
4. Go to **Credentials → Create OAuth 2.0 Client ID**
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://your-app.vercel.app/api/auth/callback/google` (production)
6. Copy **Client ID** → `AUTH_GOOGLE_ID`
7. Copy **Client Secret** → `AUTH_GOOGLE_SECRET`

## 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## 4. Database Setup
```bash
# Install dependencies
npm install

# Push schema to Supabase
npm run db:push

# Seed with historical data (invoices 2025-2026, net worth Q4 2021 → Q2 2026)
npm run db:seed
```

## 5. Local Development
```bash
npm run dev
# Open http://localhost:3000
```

## 6. Deploy to Vercel
1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Add `CRON_SECRET` (any random string) for the quarterly reminder cron
5. Deploy!

## 7. Resend (optional, for email reminders)
1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key → `RESEND_API_KEY`
4. Update the `from` address in `src/app/api/cron/quarterly-reminder/route.ts`

## Architecture

```
src/
├── app/
│   ├── api/           # REST API endpoints
│   ├── dashboard/     # Home dashboard
│   ├── invoices/      # Invoice management
│   ├── net-worth/     # Net worth tracker
│   ├── allocation/    # Portfolio allocation charts
│   ├── settings/      # Settings + admin
│   └── login/         # Auth page
├── components/
│   ├── charts/        # Recharts components
│   ├── layout/        # Sidebar, mobile nav
│   └── ui/            # Reusable UI components
└── lib/
    ├── auth.ts        # NextAuth config
    ├── prisma.ts      # DB client
    └── utils.ts       # Helpers
prisma/
├── schema.prisma      # DB schema
└── seed.ts            # Historical data import
```

## Quarterly reminder
The cron job runs daily at 8am and sends an email 5 days before each quarter end:
- March 26, June 25, September 25, December 26

Configure the `CRON_SECRET` env var in Vercel and the cron is automatically registered via `vercel.json`.

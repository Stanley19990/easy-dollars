# Easy Dollars - AI-Powered Earning Platform

A Next.js application that allows users to earn money by watching ads through AI-optimized virtual machines.

## Features

- 🤖 AI-powered earning optimization
- 💰 Virtual machine marketplace
- 📱 Mobile-first responsive design
- 🔐 Secure authentication with Supabase
- 👥 Referral system
- 💳 Wallet and withdrawal management
- 🛡️ Admin panel for platform management

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd easy-dollars
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Fill in your environment variables in `.env.local`:
   - Get your Supabase credentials from your Supabase dashboard
   - Add your admin email addresses

5. Set up the database
   - Run the SQL script in `scripts/01-create-database-schema.sql` in your Supabase SQL editor

6. Start the development server
\`\`\`bash
npm run dev
\`\`\`

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

See `.env.example` for all required and optional environment variables.

### Required Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (server-only)

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── dashboard/         # User dashboard
│   ├── wallet/            # Wallet management
│   └── referrals/         # Referral system
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
└── scripts/               # Database scripts
\`\`\`

## Admin Access

Admin access is restricted to specific email addresses defined in the environment variables or hardcoded in `lib/auth-admin.ts`.

## API Routes

The application includes secure API routes for admin operations:

- `POST /api/admin/withdrawal/approve` - Approve withdrawal requests
- `POST /api/admin/withdrawal/reject` - Reject withdrawal requests  
- `POST /api/admin/earnings/credit-daily` - Credit daily earnings
- `POST /api/admin/users/balance` - Update user balances

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.
# easy-dollars

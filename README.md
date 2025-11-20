# Voicething - AI Voice Agent Platform

**Voicething** - Create, manage, and deploy intelligent AI voice assistants with advanced conversational capabilities.

Voicething is a powerful platform that enables businesses to build and deploy AI voice agents for customer service, sales, and support. Built with modern web technologies, it provides an intuitive interface for managing voice agents, handling calls, and integrating with multiple communication channels.

## Features

- **AI Agents Management** - Create, configure, and manage AI voice agents with a multi-step setup wizard
- **Voice Integration** - Powered by Vapi AI with ElevenLabs voices and Deepgram transcription
- **Multi-Channel Support** - Integrate with SMS, WhatsApp, Telegram, and more
- **Call Management** - Track call history, voicemails, and conversation analytics
- **Onboarding Flow** - Guided setup process for new users (business info, phone setup, voice selection, channels)
- **Authentication** - Secure authentication with Supabase (email/password and OAuth)
- **Responsive Design** - Mobile-first, fully responsive interface
- **Customizable Themes** - Light/dark modes with multiple color presets (Tangerine, Neo Brutalism, Soft Pop)
- **Flexible Layouts** - Collapsible sidebar and customizable content widths
- **Real-time Testing** - Test your voice agents directly from the dashboard using Vapi Web SDK

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **UI Components**: Shadcn UI
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security)
- **Voice AI**: Vapi AI, ElevenLabs, Deepgram
- **Validation**: Zod
- **Forms & State Management**: React Hook Form, Zustand
- **Tables & Data Handling**: TanStack Table, TanStack React Query
- **3D Graphics**: React Three Fiber, Three.js
- **Tooling & DX**: ESLint, Prettier, Husky

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Vapi AI API keys (for voice agent functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voicething
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Vapi AI
   VAPI_API_KEY=your_vapi_api_key_here
   VAPI_API_URL=https://api.vapi.ai
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key_here
   ```

4. **Set up the database**

   - Go to your Supabase dashboard
   - Navigate to **SQL Editor**
   - Run the migrations from `supabase-migrations.sql` and `ai-agents-migration.sql`

   See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Your app will be running at [http://localhost:3000](http://localhost:3000)

## Project Structure

This project follows a **colocation-based architecture** where each feature keeps its own pages, components, and logic inside its route folder. Shared UI, hooks, and configuration live at the top level, making the codebase modular, scalable, and easier to maintain.

```
src/
├── app/                    # Next.js app router pages
│   ├── (main)/            # Main application routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard and AI agents
│   │   └── onboarding/    # User onboarding flow
│   └── (external)/         # External/public pages
├── components/             # Shared UI components
├── lib/                    # Utilities and helpers
├── server/                 # Server actions
├── types/                  # TypeScript type definitions
└── config/                 # App configuration
```

## Key Features in Detail

### AI Agents

Create and manage AI voice agents with:
- Multi-step setup wizard (Basics, Personality & Voice, Preview)
- Business type-specific configurations
- Voice selection (Elliot, Rachel, Adam, Bella, Josh)
- Tone customization (Professional, Friendly, Casual, Formal)
- Real-time testing with web-based voice calls
- Full CRUD operations with data tables

### Onboarding

Guided onboarding process includes:
1. Welcome
2. Business Information
3. Phone Setup
4. Voice Selection
5. Communication Channels
6. Test Assistant

### Authentication

- Email/password authentication
- OAuth providers (Google)
- Email verification
- Password reset flow
- Protected routes with middleware

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Database and authentication setup
- [AI Agents Setup Guide](./AI_AGENTS_SETUP_GUIDE.md) - AI agents feature documentation
- [OAuth Debug Guide](./OAUTH_DEBUG_GUIDE.md) - Troubleshooting OAuth issues
- [OAuth Troubleshooting](./OAUTH_TROUBLESHOOTING.md) - Common OAuth problems and solutions

## Contributing

Contributions are welcome! Please feel free to open issues, feature requests, or submit pull requests.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](./LICENSE) for details.

---

**Happy Building!** 🚀

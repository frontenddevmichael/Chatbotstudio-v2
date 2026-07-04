# ChatBot Studio

ChatBot Studio is a no-code AI chatbot creation platform that enables businesses, creators, and organizations to build, train, and deploy intelligent chatbots in minutes — without writing code.

---

## Getting Started

### Prerequisites
- Node.js 22+
- npm 10+
- A Supabase project (free tier works)
- An OpenRouter (or compatible) API key for AI features

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd ideaweave-bot

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Edit .env with your Supabase project details and API keys

# 4. Start the dev server
npm run dev
```

### Environment Variables

See `.env.example` for the full list of required variables. Key ones:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (auth pages) |

Edge function secrets are managed in the Supabase dashboard under **Edge Functions → Secrets**.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm test             # Run all tests (vitest)
npm run lint         # ESLint check
npm run preview      # Preview production build
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run a specific test file
npx vitest run src/test/sendWebhook.test.ts
```

### Deployment

**Frontend (Vercel)**:
```bash
npm run build
npx vercel --prod
```

**Supabase Edge Functions**:
```bash
supabase functions deploy --project-ref <project-id>
supabase db push
```

### CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs lint + typecheck + tests on every push and PR. On pushes to `main`, it also builds and deploys to Vercel (requires repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

The platform focuses on simplicity and accessibility. Users can create a functional chatbot by filling out a few forms, uploading FAQs or knowledge content, and instantly deploying the bot on their website.

ChatBot Studio is designed with a freemium model, allowing anyone to start for free while offering premium upgrades for advanced AI capabilities.

 Purpose

Many small and medium businesses want AI chatbots but:

Cannot afford developers

Do not have technical expertise

Find existing tools too complex

ChatBot Studio solves this by allowing users to:

Create chatbots in minutes

Train bots using their own business knowledge

Deploy bots on websites or messaging platforms

Monitor conversations and improve responses

All without coding.

⚙️ Key Features
🧱 No-Code Chatbot Builder

ChatBot Studio provides a simple guided setup process.

Users can create a chatbot by:

Naming the chatbot

Setting a welcome message

Uploading FAQs or knowledge documents

Choosing chatbot tone or personality

Customizing chatbot appearance

Deploying instantly

No technical setup required.

⚡ Supercharged FAQ System

One of the platform's unique capabilities is the Supercharge feature.

Instead of manually writing multiple variations of the same question, the platform automatically expands user intents.

Example:

Input question:

What are your opening hours?

The system can understand related queries like:

When do you open?

What time do you close?

Are you open today?

Business hours?

This significantly improves chatbot accuracy and natural conversation flow.

💬 AI Conversational Chatbot

ChatBot Studio supports conversational AI capabilities beyond simple FAQ bots.

Bots can:

Hold natural conversations

Understand contextual questions

Respond intelligently beyond exact keyword matches

Future versions may include:

Voice AI interactions

AI agents

Multi-step conversational workflows

🌐 Easy Deployment

Once created, chatbots can be deployed across multiple platforms.

Deployment options include:

Website embed widget

API integration

Messaging platform integrations (planned)

This allows a single chatbot to operate across different environments.

📊 User Dashboard

Each user has access to a dashboard where they can manage their chatbots and track performance.

Dashboard features include:

Managing multiple chatbots

Updating FAQs and knowledge base

Viewing chatbot conversations

Monitoring activity

Tracking engagement metrics

Typical metrics include:

Total chats

Active users

Conversation history

Performance analytics

🛠 Super Admin Panel

The platform owner has a master administration system with full control over the ecosystem.

Admin capabilities include:

Managing users

Viewing all created chatbots

Monitoring platform activity

Managing advertisements

Controlling system settings

Managing premium subscriptions

💰 Monetization Model

ChatBot Studio uses a freemium business model.

Free Plan

Users can:

Create 1 chatbot

Send limited monthly messages

Access basic analytics

Use the platform with ChatBot Studio branding

See ads within the dashboard

Premium Plan

Paid users unlock:

Multiple chatbots

Advanced AI models

Custom branding

Advanced analytics

Ad-free experience

Voice AI capabilities (future)

📢 Advertising System

To support the free platform, advertisements may appear in:

Dashboard sidebar

Chatbot preview pages

Resource sections

Initially, ads promote internal platforms such as:

Switch2Tech

EstateGO

Africa AI Hackathon

Future versions may include third-party advertisers.

🧠 Technology Concept

ChatBot Studio combines several modern technologies.

Frontend

Handles the user interface where users create and manage chatbots.

Backend

Responsible for:

User accounts

Chatbot configurations

Conversation storage

Analytics tracking

AI Engine

Processes messages and generates responses using:

Large Language Models

Knowledge retrieval systems

Intent matching algorithms

🚀 Long-Term Vision

ChatBot Studio aims to evolve into a complete AI automation platform for businesses.

Future capabilities may include:

Voice AI agents

AI customer support automation

CRM integrations

WhatsApp AI bots

AI sales assistants

Business workflow automation

The ultimate goal is to transform ChatBot Studio into a full AI business assistant platform for SMEs worldwide.

📄 License

This project is released under the MIT License.

If you want, I can also show you 3 things that make a README 10x more impressive to recruiters (most developers forget them), like:

adding architecture diagrams

adding API documentation

adding screenshots that make the repo look like a real SaaS product.

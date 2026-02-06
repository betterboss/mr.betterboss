# Mr. Better Boss - AI JobTread Sidebar

A production-ready AI sidebar for JobTread users, powered by Claude with web search. Built by Better Boss, JobTread Certified Implementation Partner.

## Deploy to Vercel (One Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/betterboss/mr.betterboss&project-name=mr-better-boss&repository-name=mr-better-boss)

**That's it.** Click the button above, authorize GitHub, and Vercel handles everything else. Your app will be live in ~60 seconds.

## How Login Works

1. User opens the app at `your-project.vercel.app`
2. Login screen appears asking for an **Anthropic API key**
3. User enters their `sk-ant-...` key from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
4. Key is validated with a live API call
5. On success, key is saved to browser localStorage (never sent to any server except Anthropic directly)
6. User is logged in and can chat immediately

**No database needed.** No passwords to manage. No user accounts to provision. Each user brings their own API key.

## Features

- **Live AI Chat** - Claude Sonnet 4 with web search for real-time JobTread answers
- **Login System** - API key authentication with validation and persistent sessions
- **Better Boss Knowledge** - Full implementation expertise baked into every response
- **Quick Actions** - One-click prompts for estimates, automations, catalogs, integrations
- **Settings Panel** - Customize bot name, tagline, welcome message, quick actions
- **Markdown Rendering** - Bold, italic, code blocks, inline code in responses
- **Responsive Design** - Works as desktop sidebar or full-screen on mobile
- **Edge Runtime** - Fast responses via Vercel Edge Functions

## Manual Deploy (Alternative)

### Option A: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select `betterboss/mr.betterboss`
4. Click "Deploy"
5. Live in ~60 seconds at `your-project.vercel.app`

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Architecture

```
app/
  layout.js              # Root layout, Inter font, viewport config
  page.js                # Full sidebar UI (login, chat, settings)
  api/
    chat/
      route.js           # Claude API endpoint (edge runtime, web search)
package.json             # Next.js 14, React 18, Anthropic SDK
next.config.js           # Next.js configuration
```

**Data flow:** Browser -> `/api/chat` (edge) -> Anthropic API -> Claude response -> Browser

**No backend database.** API key and settings stored in browser localStorage only.

## Customization

| What | Where | How |
|------|-------|-----|
| Bot personality & tone | `app/api/chat/route.js` → `SYSTEM_PROMPT` | Edit the personality section |
| Knowledge base | `app/api/chat/route.js` → `BETTER_BOSS_KNOWLEDGE` | Add/edit company info |
| Default quick actions | `app/page.js` → `DEFAULT_SETTINGS` | Edit the quickActions array |
| Colors & styling | `app/page.js` → `styles` object | Change hex colors |
| AI model | `app/api/chat/route.js` → `model` param | Change to different Claude model |

## Tech Stack

- **Next.js 14** (App Router)
- **Claude Sonnet 4** via Anthropic SDK v0.73+
- **Web Search** via Anthropic's built-in web search tool
- **Vercel Edge Functions** for low-latency API calls
- **Zero external CSS** - inline styles only, no build dependencies

## Support

For JobTread implementation help: [better-boss.ai/audit](https://better-boss.ai/audit)

---

Built by [Better Boss](https://better-boss.ai) - JobTread Certified Implementation Partner

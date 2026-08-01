# ANSEMRIAL — CONTINUATION GUIDE FOR NEXT AGENT SESSION

## READ THIS FIRST — YOU ARE CONTINUING, NOT STARTING FRESH

This is a **continuation guide** for the AnsemRail project. A previous agent session completed Phase 0 (installs), Phase 1 (API verification), and partially completed Phase 2 (platform build). **Do NOT redo any completed work.** Pick up where the last session left off.

---

## PROJECT SUMMARY

AnsemRail is an agentic control plane combining:
- **ClawPump.tech** — Solana agent launchpad, gasless pump.fun tokens, 65% creator fees, perps on Phoenix, agent marketplace, 122+ MCP tools
- **MoonPay Agents** — Multi-chain non-custodial wallets, fiat on/off-ramp, swaps/bridges/DCA/limit orders, 17+ skills, CLI (`mp`)
- **Open Wallet Standard (OWS)** — Local encrypted vault, policy engine, Agent Access Layer
- **Ansem utility** — $ANSEM (The Black Bull) token at `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`, signals, $ANSEM as preferred payment

Built with Next.js 16.2.12 (App Router) + React 19 + TypeScript + Tailwind v4 + Drizzle ORM + Neon PostgreSQL + NextAuth.

**IMPORTANT**: This is Next.js 16, NOT 15. There may be breaking changes from your training data. Read `node_modules/next/dist/docs/` before writing Next.js code.

---

## ENVIRONMENT NOTES (NixOS)

- OS is NixOS (read-only nix store). npm global installs must use a custom prefix:
  ```bash
  mkdir -p /workspace/.npm-global
  npm config set prefix /workspace/.npm-global
  export PATH="/workspace/.npm-global/bin:$PATH"
  ```
- Prisma does NOT work on NixOS (no precompiled engines). **Drizzle ORM** is used instead.
- MoonPay CLI installed with `--ignore-scripts` (native `usb` dependency fails without libudev).
- `@clawpump/agents` npm package has no `dist/` build output — use REST API instead.
- OWS CLI is a precompiled Rust binary — works perfectly.

---

## WHAT'S DONE ✅

### Phase 0 — Installs ✅
- Node v22.20.0, npm 10.9.3
- MoonPay CLI v1.95.2 (at `/workspace/.npm-global/bin/mp`)
- @clawpump/agents v0.1.25 (at `/workspace/.npm-global/bin/clawpump-agents` — but broken, use REST)
- OWS v1.4.2 (at `/workspace/.npm-global/bin/ows`)
- Next.js 16.2.12 project scaffolded at `/workspace/ansemrail`
- All npm dependencies installed in `/workspace/ansemrail/node_modules`

### Phase 1 — API Verification ✅
All verified with raw responses. See README.md for full matrix.

**Key findings:**
- ClawPump `/api/v1/*` endpoints work with `Authorization: Bearer cpk_...` header
- ClawPump `/api/tokens` works without auth
- ClawPump `/api/health`, `/api/stats`, `/api/leaderboard` return HTML (not JSON) — may only work via MCP
- ClawPump `/api/mcp` hosted MCP returns HTML — not live yet
- MoonPay `/api/tools/*` works anonymously for read operations (token_search, token_trending_list, token_retrieve)
- OWS CLI fully operational (wallet, policy, key creation all verified)
- $ANSEM token: `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump` — confirmed "Ansem's wallet has been confirmed. 65% of the supply has been sent to his wallet."

### Phase 2 — Build (PARTIAL) 🚧

**Completed files:**
1. `/workspace/ansemrail/drizzle.config.ts` — Drizzle config
2. `/workspace/ansemrail/.env` — Real env vars (gitignored, contains all API keys)
3. `/workspace/ansemrail/.env.example` — Empty template
4. `/workspace/ansemrail/src/db/schema.ts` — Full Drizzle schema (users, agents, registrations, listings, bids, signals, agent_signals, skills, ows_policies, sessions, accounts)
5. `/workspace/ansemrail/src/db/client.ts` — Neon + Drizzle client
6. `/workspace/ansemrail/src/lib/clawpump.ts` — ClawPump API client (15+ functions)
7. `/workspace/ansemrail/src/lib/moonpay.ts` — MoonPay API client + ANSEM config
8. `/workspace/ansemrail/src/lib/ows.ts` — OWS CLI wrapper + policy builders
9. `/workspace/ansemrail/src/lib/helius.ts` — Helius RPC client
10. `/workspace/ansemrail/src/lib/crypto.ts` — AES-256-GCM encryption
11. `/workspace/ansemrail/src/lib/utils.ts` — Utility functions
12. `/workspace/ansemrail/src/lib/auth.ts` — NextAuth config (Google + Credentials)
13. `/workspace/ansemrail/src/app/api/auth/[...nextauth]/route.ts` — NextAuth route
14. `/workspace/ansemrail/src/lib/telegram.ts` — Full Telegram bot library (12+ commands, inline keyboards, callback handlers)
15. `/workspace/ansemrail/README.md` — Comprehensive documentation

---

## WHAT'S LEFT TO BUILD ❌

### Priority 1 — Core API Routes & Pages (MUST DO)

1. **Telegram webhook route** — `src/app/api/telegram/route.ts`
   - POST handler that calls `handleTelegramUpdate()` from `src/lib/telegram.ts`
   - Set webhook on deploy: `POST /api/telegram` with the bot token

2. **Registration API routes:**
   - `src/app/api/register/human/route.ts` — POST: accepts email, googleId, walletAddress, clawpumpApiKey. Creates user in DB with type="human". Encrypts API key.
   - `src/app/api/register/agent/route.ts` — POST: accepts Ed25519 publicKey + signature OR SKILL.md content. Verifies signature. Creates user with type="agent". Returns agent ID + token.
   - `src/app/api/register/verify/route.ts` — POST: verify Ed25519 signature using tweetnacl

3. **`/register` page** — `src/app/register/page.tsx`
   - Toggle: "I am a Human" | "I am an Agent"
   - Human form: Google OAuth button, wallet address input, cpk_ key input, MoonPay email
   - Agent form: SKILL.md file upload OR Ed25519 public key + signature + payload
   - On submit → calls registration API → redirects to /dashboard

4. **Layout + Navigation** — `src/app/(dashboard)/layout.tsx`
   - Sidebar nav with links to all pages
   - Top bar with user info + $ANSEM price ticker
   - Auth guard (redirect to /register if not authenticated)

5. **`/dashboard` page** — `src/app/(dashboard)/dashboard/page.tsx`
   - Cards: total agents, total balance (SOL + USDC), 65% earnings, $ANSEM price
   - Agent list with status, model, skills
   - Recent signals feed
   - Calls: `listAgents()`, `getAnsemTokenInfo()`, `getTrendingTokens()`

6. **`/agents` page** — `src/app/(dashboard)/agents/page.tsx`
   - List all ClawPump agents (from `listAgents()`)
   - Create agent form (name, persona, model, skills checkboxes from `listSkills()`)
   - Agent detail view: chat, start/stop, update skills
   - Calls: `listAgents()`, `createAgent()`, `updateAgent()`, `chatWithAgent()`

### Priority 2 — Feature Pages

7. **`/marketplace` page** — `src/app/(dashboard)/marketplace/page.tsx`
   - Browse ClawPump tokens (from `getTokens()`)
   - Browse ClawPump marketplace listings
   - Buy/bid functionality
   - AnsemRail listings from DB

8. **`/terminal` page** — `src/app/(dashboard)/terminal/page.tsx`
   - Swap interface (input mint, output mint, amount → quote from `swapQuote()`)
   - DCA creation
   - Perps (Phoenix) — markets, preview, execute
   - Sniper subscribe
   - MoonPay multi-chain swaps/bridges
   - Simulate-first pattern (show quote before execute)

9. **`/signals` page** — `src/app/(dashboard)/signals/page.tsx`
   - Ansem signal feed (from DB `signals` table)
   - Trending tokens as signals
   - Agent subscription toggle
   - WebSocket or polling for live updates

10. **`/skills` page** — `src/app/(dashboard)/skills/page.tsx`
    - Registry of ClawPump skills (from `listSkills()`)
    - MoonPay skills list (from `MOONPAY_SKILLS` constant)
    - Upload SKILL.md form
    - One-click install buttons

11. **`/settings` page** — `src/app/(dashboard)/settings/page.tsx`
    - API keys management (ClawPump, MoonPay)
    - OWS policies (spend limits, chain allowlists, Ansem-only mode)
    - Payout wallet address
    - $ANSEM preference toggle
    - Telegram chat ID linking

### Priority 3 — Required Artifacts

12. **`skills/ansemrail-register/SKILL.md`** — Registration skill
    - Full dual-path instructions for agents to self-register

13. **`vercel.json`** — Vercel config
    - Framework preset, build settings, Telegram webhook route config

14. **UI Components** — shadcn/ui style components
    - Button, Card, Input, Label, Dialog, Tabs, Table, Badge, Switch, Select
    - Create at `src/components/ui/`

15. **Drizzle migration** — Run `npx drizzle-kit push` to create tables in Neon

16. **Test suite** — `src/tests/` or `tests/`
    - Re-run verification matrix (curl ClawPump, MoonPay, OWS endpoints)
    - Test registration flows
    - Test Telegram bot

### Priority 4 — Polish

17. **Landing page** — `src/app/page.tsx` — Hero, features, CTA to register
18. **Loading states, error boundaries**
19. **Responsive design**
20. **Dark mode** (ClawPump-style dark theme)

---

## ENVIRONMENT VARIABLES (already in .env, gitignored)

```
CLAWPUMP_API_KEY=cpk_lpWha1WqYxkyCIFkaKwqB143VcI3a5OLMXOwBkGNkSU
MOONPAY_EMAIL=
DATABASE_URL=postgresql://neondb_owner:npg_UwOs4NcGgI9Q@ep-delicate-grass-axu7dz5x.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=b70c937a4bbac44a61c79bef37aa3fa2ad394a48da8b8e428011c61fb014130d
NEXTAUTH_URL=http://localhost:3000
OWS_WALLET_NAME=ansemrail-treasury
NEXT_PUBLIC_APP_URL=http://localhost:3000
HELIUS_API_KEY=9a468116-ce99-46d4-9adf-2568be3cf1b4
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=9a468116-ce99-46d4-9adf-2568be3cf1b4
ENCRYPTION_KEY=b70c937a4bbac44a61c79bef37aa3fa2ad394a48da8b8e428011c61fb014130d
UPSTASH_REDIS_REST_URL=https://definite-walrus-35650.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYtCAAIgcDEwNTUxMzRkNjM3NTU0OWU0YTBmNWI2ZmFmMTcyZTY5ZQ
TELEGRAM_BOT_TOKEN=8979997512:AAH2KSjp_tX8EL9sex64yZi6h4pjteZT4yU
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ANSEM_TOKEN_MINT=9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump
```

**Additional credentials (not in .env, for deployment):**
- Neon API token: `napi_qc3mermompqti0e6dvx2yqq0fs13g8tc6zv94moxc3n0ae7kz3k9r8a6ajdju2k0`
- Neon org ID: `org-proud-leaf-88507341`
- GitHub token: `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`
- Vercel tokens: `vcp_8LotOyegDtoW1GtwFBgPrhPjjeXsL44urz9qJxfEcDuCWJFEjh17Vnle` / `vcp_61vOK63Bu9cPo1FWCzQJ8H5rKaOldaH7QikR`
- Upstash Redis CLI: `redis-cli --tls -u redis://default:AYtCAAIgcDEwNTUxMzRkNjM3NTU0OWU0YTBmNWI2ZmFmMTcyZTY5ZQ@definite-walrus-35650.upstash.io:6379`

---

## HOW TO CONTINUE BUILDING

1. **Read existing code first** — All lib files in `src/lib/` are complete and verified. Read them before writing new code to understand available functions.

2. **Build order**: API routes → pages → UI components → tests → deploy

3. **Key import paths**:
   - `@/lib/clawpump` — ClawPump API functions
   - `@/lib/moonpay` — MoonPay API functions + ANSEM config
   - `@/lib/ows` — OWS CLI wrapper
   - `@/lib/helius` — Helius RPC
   - `@/lib/crypto` — encrypt/decrypt API keys
   - `@/lib/utils` — cn, formatSol, formatUsd, shortAddress, timeAgo
   - `@/lib/auth` — NextAuth handlers
   - `@/lib/telegram` — Telegram bot
   - `@/db/client` — db (Drizzle instance)
   - `@/db/schema` — all table definitions + types

4. **For UI components**: Use Tailwind CSS v4 classes directly. Create simple components at `src/components/ui/`. Use `cn()` from `@/lib/utils` for class merging. Use `lucide-react` for icons. Use `radix-ui` primitives for interactive components (already installed).

5. **For server actions / API routes**: Only use endpoints verified in Phase 1. All ClawPump calls go through `src/lib/clawpump.ts`. All MoonPay calls go through `src/lib/moonpay.ts`.

6. **For the DB**: Run `npx drizzle-kit push` to create tables before testing.

7. **Next.js 16 note**: Read `node_modules/next/dist/docs/01-app/` for App Router conventions. Key changes from 15 may include: async params, new caching behavior, etc.

8. **SKILL.md file** must be at `skills/ansemrail-register/SKILL.md` with the exact format from the original prompt.

9. **vercel.json** should include:
   ```json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "installCommand": "npm install"
   }
   ```

---

## REGISTRATION SKILL.MD SPEC

The file `skills/ansemrail-register/SKILL.md` must contain:

```yaml
---
name: ansemrail-register
description: |
  Register a human or autonomous agent on AnsemRail (Ansem + MoonPay + ClawPump platform).
  Use when user says register on AnsemRail, join AnsemRail, I am an agent, create agent account.
  Supports human Google/wallet path and pure agent Ed25519 / SKILL.md path.
version: 1.0.0
tags: [ansemrail, registration, clawpump, moonpay, ows, agent, human]
---
```

Followed by full dual-path instructions:
- Human: create cpk_ at clawpump.tech/dashboard/api + mp login
- Agent: Ed25519 or SKILL.md upload
- Both end with agent ID + token
- Enable core skills: defi-trading, perps-trading, token-launch, moonpay-swap-tokens, moonpay-trading-automation
- Never expose keys; use OWS for signing

---

## TELEGRAM BOT SPEC

The bot is fully designed in `src/lib/telegram.ts`. Commands:
- `/start` — Welcome + inline keyboard
- `/help` — All commands
- `/ansem` — $ANSEM token info (fetches live price from MoonPay)
- `/signals` — Trending tokens on Solana
- `/marketplace` — Hot ClawPump tokens
- `/agents` — List ClawPump agents
- `/createagent` — Link to web UI
- `/register` — Registration info
- `/dashboard` — Link to dashboard
- `/settings` — Link to settings
- `/swap` — Swap info

**Still needed**: `src/app/api/telegram/route.ts` webhook endpoint that calls `handleTelegramUpdate()`.

---

## VERCEL DEPLOYMENT

After all code is complete:
```bash
# Set env vars on Vercel
vercel env add CLAWPUMP_API_KEY production
vercel env add DATABASE_URL production
# ... all env vars

# Deploy
vercel --prod

# Set Telegram webhook
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://your-app.vercel.app/api/telegram"
```

---

## SECURITY REMINDERS

- **NEVER commit `.env`** — it's in `.gitignore` but double-check
- **NEVER log API keys** — encrypt at rest with `src/lib/crypto.ts`
- **OWS keys never touch the LLM** — use Agent Access Layer
- **ClawPump `cpk_` key** is sent as Bearer header only, never logged
- **MoonPay credentials** stored in `~/.config/moonpay/credentials.json` (local only)
- **Rotate all credentials** after this project — they were shared in plaintext in the original prompt

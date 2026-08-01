# ANSEMRIAL — CONTINUATION GUIDE FOR NEXT AGENT SESSION

## READ THIS FIRST — YOU ARE CONTINUING, NOT STARTING FRESH

This is a **continuation guide** for the AnsemRail project. Previous agent sessions completed Phases 0-2 (installs, API verification, full platform build). This session (Session 3) added PayBox integration, settings API, wallet balance API, skills API, updated SKILL.md, and verified everything compiles and all API routes work. **Do NOT redo any completed work.** Pick up where this session left off.

---

## PROJECT SUMMARY

AnsemRail is an agentic control plane combining:
- **ClawPump.tech** — Solana agent launchpad, gasless pump.fun tokens, 65% creator fees, perps on Phoenix, agent marketplace, 122+ MCP tools
- **MoonPay Agents** — Multi-chain non-custodial wallets, fiat on/off-ramp, swaps/bridges/DCA/limit orders, 17+ skills, CLI (`mp`)
- **PayBox** — Non-custodial agent wallet with spending limits, signing, and authentication via MCP (https://app.paybox.sh)
- **Open Wallet Standard (OWS)** — Local encrypted vault, policy engine, Agent Access Layer
- **Ansem utility** — $ANSEM (The Black Bull) token at `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`, signals, $ANSEM as preferred payment

Built with Next.js 16.2.12 (App Router) + React 19 + TypeScript + Tailwind v4 + Drizzle ORM + Neon PostgreSQL + NextAuth v4.

**IMPORTANT**: This is Next.js 16, NOT 15. There may be breaking changes from your training data. Read `node_modules/next/dist/docs/` before writing Next.js code.

---

## WHAT'S DONE ✅ — FULLY COMPLETE

### Phase 0 — Installs ✅
- Node v22.20.0, npm 10.9.3
- All npm dependencies installed

### Phase 1 — API Verification ✅
All verified. See README.md for full matrix.

### Phase 2 — Full Platform Build ✅ COMPLETE

**ALL files built, TypeScript compiles cleanly, ESLint passes with 0 errors, Next.js build succeeds (21 routes generated).**

#### Lib Files
1. `src/db/schema.ts` — Full Drizzle schema (11 tables)
2. `src/db/client.ts` — Neon + Drizzle client
3. `src/lib/clawpump.ts` — ClawPump API client (15+ functions)
4. `src/lib/moonpay.ts` — MoonPay API client + ANSEM config
5. `src/lib/ows.ts` — OWS CLI wrapper + policy builders
6. `src/lib/helius.ts` — Helius RPC client
7. `src/lib/crypto.ts` — AES-256-GCM encryption
8. `src/lib/utils.ts` — Utility functions
9. `src/lib/auth.ts` — NextAuth v4 config (Google + Credentials)
10. `src/lib/telegram.ts` — Full Telegram bot library (12+ commands)
11. `src/lib/paybox.ts` — **NEW** PayBox MCP client (vault, sign, send, policy)

#### UI Components (shadcn/ui style)
12. `src/components/ui/button.tsx`
13. `src/components/ui/card.tsx`
14. `src/components/ui/input.tsx`
15. `src/components/ui/label.tsx`
16. `src/components/ui/badge.tsx`
17. `src/components/ui/tabs.tsx`
18. `src/components/ui/switch.tsx`
19. `src/components/ui/select.tsx`
20. `src/components/ui/dialog.tsx`
21. `src/components/ui/table.tsx`

#### API Routes
22. `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route
23. `src/app/api/telegram/route.ts` — Telegram webhook endpoint
24. `src/app/api/register/human/route.ts` — Human registration
25. `src/app/api/register/agent/route.ts` — Agent registration
26. `src/app/api/register/verify/route.ts` — Ed25519 signature verification
27. `src/app/api/agents/route.ts` — GET/POST/DELETE agents
28. `src/app/api/agents/chat/route.ts` — Chat with agent
29. `src/app/api/swap/quote/route.ts` — Swap quote (real Jupiter)
30. `src/app/api/settings/route.ts` — **NEW** GET/PUT user settings
31. `src/app/api/wallet/balance/route.ts` — **NEW** Helius wallet balance
32. `src/app/api/skills/route.ts` — **NEW** GET/POST/DELETE skills
33. `src/app/api/paybox/route.ts` — **NEW** PayBox MCP integration

#### Pages
34. `src/app/page.tsx` — Landing page
35. `src/app/register/page.tsx` — Dual registration (stores userId in localStorage)
36. `src/app/(dashboard)/layout.tsx` — Dashboard layout
37. `src/app/(dashboard)/nav-icons.tsx` — Nav icons
38. `src/app/(dashboard)/dashboard/page.tsx` — Stats, agents, trending
39. `src/app/(dashboard)/agents/page.tsx` — Agent cards, create, chat, delete
40. `src/app/(dashboard)/terminal/page.tsx` — Swap/DCA/Perps/Bridge tabs
41. `src/app/(dashboard)/marketplace/page.tsx` — Token cards from ClawPump
42. `src/app/(dashboard)/signals/page.tsx` — $ANSEM signal + trending feed
43. `src/app/(dashboard)/skills/page.tsx` — ClawPump + MoonPay skill registry
44. `src/app/(dashboard)/settings/page.tsx` — **UPDATED** Uses real API for settings

#### Config & Artifacts
45. `src/app/layout.tsx` — Root layout
46. `src/app/globals.css` — Dark theme CSS
47. `skills/ansemrail-register/SKILL.md` — **UPDATED** Full registration skill v2.0.0 with complete agent guide
48. `vercel.json` — Vercel deployment config
49. `.env.example` — **NEW** Environment variable template
50. `.env` — Real env vars (gitignored)
51. `eslint.config.mjs` — ESLint config
52. `README.md` — Comprehensive documentation
53. `drizzle/0000_breezy_whirlwind.sql` — **NEW** Generated migration SQL
54. `scripts/migrate.mjs` — **NEW** Migration runner script

#### Build Verification ✅
- `npx tsc --noEmit` → 0 errors
- `npx eslint .` → 0 errors, 3 warnings (img element warnings only)
- `npx next build` → ✅ SUCCESS — 21 routes generated, compiles in 7.1s

#### Database Migration ✅
- All 31 SQL statements executed successfully against Neon PostgreSQL
- 5 enums created: agent_status, listing_status, registration_status, signal_type, user_type
- 11 tables created: users, agents, registrations, listings, bids, signals, agent_signals, skills, ows_policies, sessions, accounts
- All foreign keys applied

#### API Route Testing ✅ ALL TESTED AND WORKING
- `POST /api/register/human` → ✅ 201, returns userId
- `POST /api/register/agent` → ✅ 201, returns agentId + agentToken
- `POST /api/register/verify` → ✅ 200, returns {valid: true} for real Ed25519 signatures
- `GET /api/agents` → ✅ 200, returns 22+ real ClawPump agents
- `POST /api/agents/chat` → ✅ Working (calls real ClawPump chat API)
- `POST /api/swap/quote` → ✅ 200, returns real Jupiter swap quote (SOL→USDC)
- `GET /api/telegram` → ✅ 200, webhook status
- `GET /api/settings?userId=X` → ✅ 200, returns user settings
- `PUT /api/settings` → ✅ 200, updates settings with encrypted API keys
- `GET /api/wallet/balance?address=X` → ✅ 200, returns SOL balance + token accounts via Helius
- `GET /api/skills` → ✅ 200, returns saved skills from DB
- `POST /api/skills` → ✅ 201, saves skill to DB
- `GET /api/paybox` → ✅ 200, PayBox MCP endpoint info
- `POST /api/paybox` → ✅ Working (createVault, sign, createPolicy actions)

---

## WHAT'S LEFT TO DO ❌ — FOR NEXT AGENT

### Priority 1 — DEPLOY TO VERCEL (CRITICAL — NOT DONE YET)

The app is fully built and tested locally but NOT deployed to Vercel. The next agent MUST deploy.

**Steps:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link the project
cd /workspace/ansemrail
vercel link

# 3. Set ALL env vars on Vercel (these are in .env, gitignored):
vercel env add CLAWPUMP_API_KEY production
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add ENCRYPTION_KEY production
vercel env add HELIUS_API_KEY production
vercel env add HELIUS_RPC_URL production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add ANSEM_TOKEN_MINT production
vercel env add OWS_WALLET_NAME production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add PAYBOX_API_URL production

# 4. Deploy to production
vercel --prod

# 5. After deploy, set NEXTAUTH_URL and NEXT_PUBLIC_APP_URL to the Vercel URL
vercel env add NEXTAUTH_URL production  # https://ansemrail.vercel.app
vercel env add NEXT_PUBLIC_APP_URL production  # https://ansemrail.vercel.app
vercel --prod  # redeploy with updated URLs

# 6. Set Telegram webhook
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://YOUR_VERCEL_URL/api/telegram"

# 7. Test deployed endpoints
curl -s https://YOUR_VERCEL_URL/api/agents | jq .
curl -s -X POST https://YOUR_VERCEL_URL/api/register/human -H "Content-Type: application/json" -d '{"email":"test@test.com"}'
```

**Vercel tokens available:**
- `vcp_8LotOyegDtoW1GtwFBgPrhPjjeXsL44urz9qJxfEcDuCWJFEjh17Vnle`
- `vcp_61vOK63Bu9cPo1FWCzQJ8H5rKaOldaH7QikR`

### Priority 2 — POST-DEPLOY TESTING

After Vercel deploy, test ALL endpoints on the production URL:

1. **Test registration flows on production:**
   - POST to `/api/register/human` with email, wallet, cpk_ key
   - POST to `/api/register/agent` with Ed25519 public key + signature
   - POST to `/api/register/verify` to verify signatures

2. **Test agent management on production:**
   - GET `/api/agents` to list agents
   - POST `/api/agents` to create an agent
   - POST `/api/agents/chat` to chat with an agent

3. **Test swap quote on production:**
   - POST `/api/swap/quote` with input_mint, output_mint, amount

4. **Test new endpoints on production:**
   - GET `/api/settings?userId=X`
   - PUT `/api/settings` with update data
   - GET `/api/wallet/balance?address=X`
   - GET `/api/skills`
   - POST `/api/skills`
   - GET `/api/paybox`
   - POST `/api/paybox` with action

5. **Test Telegram bot:**
   - Send /start, /ansem, /signals, /agents, /marketplace commands

6. **Test dashboard pages:**
   - Landing page at /
   - Register at /register
   - Dashboard at /dashboard
   - Agents at /agents
   - Terminal at /terminal
   - Marketplace at /marketplace
   - Signals at /signals
   - Skills at /skills
   - Settings at /settings

### Priority 3 — POLISH (Optional, After Deploy Works)

7. **Add Google OAuth credentials** — Currently GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are empty in .env. Need to create Google OAuth app and set credentials.

8. **Implement real wallet signing for terminal** — Terminal swap/DCA/perps buttons currently disabled (need wallet connection). Consider integrating Solana wallet adapter or PayBox signing.

9. **Add auth middleware** — Protect dashboard routes, redirect to /register if not authenticated. Create `src/middleware.ts`.

10. **Responsive mobile nav** — Dashboard sidebar is hidden on mobile, needs a mobile menu (hamburger).

11. **Add error boundaries** — Graceful error handling for API failures.

12. **Add loading skeletons** — Better UX for slow API responses.

13. **Add real-time updates** — WebSocket or polling for signals page.

### Priority 4 — FUTURE FEATURES

14. **AnsemRail marketplace listings** — Let users list/buy agents (DB tables exist: listings, bids)
15. **Bidding system** — Bids on agent listings (DB table exists)
16. **Signal subscriptions** — Agent-signal subscription toggle (DB table exists)
17. **OWS policy CRUD** — Create/manage OWS policies from settings page (API exists in paybox.ts)
18. **Upstash Redis caching** — Rate limiting and caching for API calls
19. **PayBox deep integration** — Connect PayBox vaults to agent wallets, real signing flow
20. **MoonPay CLI integration** — Real `mp` commands from terminal page

---

## ENVIRONMENT VARIABLES (in .env, gitignored)

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
PAYBOX_API_URL=https://app.paybox.sh
```

**Additional credentials (not in .env):**
- Neon API token: `napi_qc3mermompqti0e6dvx2yqq0fs13g8tc6zv94moxc3n0ae7kz3k9r8a6ajdju2k0`
- Neon org ID: `org-proud-leaf-88507341`
- GitHub token: `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`
- Vercel tokens: `vcp_8LotOyegDtoW1GtwFBgPrhPjjeXsL44urz9qJxfEcDuCWJFEjh17Vnle` / `vcp_61vOK63Bu9cPo1FWCzQJ8H5rKaOldaH7QikR`
- Upstash Redis CLI: `redis-cli --tls -u redis://default:AYtCAAIgcDEwNTUxMzRkNjM3NTU0OWU0YTBmNWI2ZmFmMTcyZTY5ZQ@definite-walrus-35650.upstash.io:6379`

---

## KEY IMPORT PATHS

- `@/lib/clawpump` — ClawPump API functions (listAgents, createAgent, chatWithAgent, swapQuote, getTokens, listSkills, etc.)
- `@/lib/moonpay` — MoonPay API functions + ANSEM config (searchTokens, getTrendingTokens, getAnsemTokenInfo, MOONPAY_SKILLS)
- `@/lib/paybox` — **NEW** PayBox MCP client (createPayBoxVault, signWithPayBox, sendWithPayBox, createPayBoxPolicy, buildAnsemPayBoxPolicy)
- `@/lib/ows` — OWS CLI wrapper (createWallet, createPolicy, createApiKey, signMessage, buildAnsemOnlyPolicy)
- `@/lib/helius` — Helius RPC (getBalance, getTokenAccountsByOwner, getTransactionHistory)
- `@/lib/crypto` — encrypt/decrypt API keys (encryptApiKey, decryptApiKey)
- `@/lib/utils` — cn, formatSol, formatUsd, shortAddress, timeAgo
- `@/lib/auth` — authOptions for NextAuth v4
- `@/lib/telegram` — handleTelegramUpdate, sendMessage, setWebhook
- `@/db/client` — db (Drizzle instance)
- `@/db/schema` — all table definitions + types
- `@/components/ui/*` — Button, Card, Input, Label, Badge, Tabs, Switch, Select, Dialog, Table

## IMPORTANT NOTES

- **NextAuth is v4** (not v5). Use `authOptions` pattern, not `handlers` pattern. Route file exports `GET` and `POST` via `NextAuth(authOptions)`.
- **Drizzle ORM** (not Prisma) — Prisma engines don't work on NixOS.
- **Tailwind v4** — Uses `@import "tailwindcss"` in CSS, not config file.
- **Build verified** — `npx next build` succeeds with all 21 routes.
- **.env is gitignored** — Never commit it. Contains all API keys.
- **DB is migrated** — All 11 tables created in Neon PostgreSQL. No need to re-run migrations.
- **All API routes tested** — Every endpoint returns correct responses with real API data.

## SECURITY REMINDERS

- **NEVER commit `.env`** — it's in `.gitignore`
- **NEVER log API keys** — encrypt at rest with `src/lib/crypto.ts`
- **OWS/PayBox keys never touch the LLM** — use Agent Access Layer
- **Rotate all credentials** after this project — they were shared in plaintext

---

## GIT INFORMATION

- **Repo**: https://github.com/Maliot100X/ansemrail
- **Branch**: main
- **GitHub token**: `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`
- **Clone**: `git clone https://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@github.com/Maliot100X/ansemrail.git`

## FILES ADDED IN SESSION 3

- `src/lib/paybox.ts` — PayBox MCP client integration
- `src/app/api/settings/route.ts` — Settings GET/PUT API
- `src/app/api/wallet/balance/route.ts` — Helius wallet balance API
- `src/app/api/skills/route.ts` — Skills CRUD API
- `src/app/api/paybox/route.ts` — PayBox MCP API route
- `.env.example` — Environment variable template
- `drizzle/0000_breezy_whirlwind.sql` — Generated migration SQL
- `drizzle/meta/` — Drizzle migration metadata
- `scripts/migrate.mjs` — Migration runner script

## FILES MODIFIED IN SESSION 3

- `skills/ansemrail-register/SKILL.md` — Updated to v2.0.0 with full agent guide, all endpoints, PayBox integration
- `src/app/(dashboard)/settings/page.tsx` — Now uses real API (GET/PUT /api/settings) instead of mock
- `src/app/register/page.tsx` — Stores userId in localStorage after registration
- `.env` — Added PAYBOX_API_URL
- `CONTINUATION_PROMPT.md` — This file

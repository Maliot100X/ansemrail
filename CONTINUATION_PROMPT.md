# ANSEMRIAL — CONTINUATION GUIDE FOR NEXT AGENT SESSION

## READ THIS FIRST — YOU ARE CONTINUING, NOT STARTING FRESH

This is a **continuation guide** for the AnsemRail project. Previous agent sessions completed Phase 0 (installs), Phase 1 (API verification), and Phase 2 (full platform build). **Do NOT redo any completed work.** Pick up where the last session left off.

---

## PROJECT SUMMARY

AnsemRail is an agentic control plane combining:
- **ClawPump.tech** — Solana agent launchpad, gasless pump.fun tokens, 65% creator fees, perps on Phoenix, agent marketplace, 122+ MCP tools
- **MoonPay Agents** — Multi-chain non-custodial wallets, fiat on/off-ramp, swaps/bridges/DCA/limit orders, 17+ skills, CLI (`mp`)
- **Open Wallet Standard (OWS)** — Local encrypted vault, policy engine, Agent Access Layer
- **Ansem utility** — $ANSEM (The Black Bull) token at `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`, signals, $ANSEM as preferred payment

Built with Next.js 16.2.12 (App Router) + React 19 + TypeScript + Tailwind v4 + Drizzle ORM + Neon PostgreSQL + NextAuth v4.

**IMPORTANT**: This is Next.js 16, NOT 15. There may be breaking changes from your training data. Read `node_modules/next/dist/docs/` before writing Next.js code.

---

## WHAT'S DONE ✅ — FULLY COMPLETE

### Phase 0 — Installs ✅
- Node v22.20.0, npm 10.9.3
- All npm dependencies installed
- Next.js 16.2.12 project scaffolded

### Phase 1 — API Verification ✅
All verified. See README.md for full matrix.

### Phase 2 — Full Platform Build ✅ COMPLETE

**ALL files built, TypeScript compiles cleanly, ESLint passes with 0 errors, Next.js build succeeds (15 routes generated).**

#### Lib Files (from previous session)
1. `src/db/schema.ts` — Full Drizzle schema
2. `src/db/client.ts` — Neon + Drizzle client
3. `src/lib/clawpump.ts` — ClawPump API client (15+ functions)
4. `src/lib/moonpay.ts` — MoonPay API client + ANSEM config
5. `src/lib/ows.ts` — OWS CLI wrapper + policy builders
6. `src/lib/helius.ts` — Helius RPC client
7. `src/lib/crypto.ts` — AES-256-GCM encryption
8. `src/lib/utils.ts` — Utility functions
9. `src/lib/auth.ts` — NextAuth v4 config (Google + Credentials) — **FIXED for v4 API**
10. `src/lib/telegram.ts` — Full Telegram bot library (12+ commands)

#### UI Components (shadcn/ui style)
11. `src/components/ui/button.tsx` — Button with variants (default, ansem, outline, ghost, etc.)
12. `src/components/ui/card.tsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
13. `src/components/ui/input.tsx` — Input
14. `src/components/ui/label.tsx` — Label (Radix)
15. `src/components/ui/badge.tsx` — Badge with variants (default, success, ansem, warning, etc.)
16. `src/components/ui/tabs.tsx` — Tabs (Radix)
17. `src/components/ui/switch.tsx` — Switch (Radix)
18. `src/components/ui/select.tsx` — Select (Radix)
19. `src/components/ui/dialog.tsx` — Dialog (Radix)
20. `src/components/ui/table.tsx` — Table components

#### API Routes
21. `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route — **FIXED for v4**
22. `src/app/api/telegram/route.ts` — Telegram webhook endpoint
23. `src/app/api/register/human/route.ts` — Human registration (email, wallet, cpk_ key, MoonPay email)
24. `src/app/api/register/agent/route.ts` — Agent registration (Ed25519 or SKILL.md)
25. `src/app/api/register/verify/route.ts` — Ed25519 signature verification (tweetnacl + bs58)
26. `src/app/api/agents/route.ts` — GET/POST/DELETE agents
27. `src/app/api/agents/chat/route.ts` — Chat with agent
28. `src/app/api/swap/quote/route.ts` — Swap quote

#### Pages
29. `src/app/page.tsx` — Landing page (hero, features, CTA)
30. `src/app/register/page.tsx` — Dual registration (Human/Agent toggle with Ed25519 + SKILL.md tabs)
31. `src/app/(dashboard)/layout.tsx` — Dashboard layout with sidebar nav + top bar
32. `src/app/(dashboard)/nav-icons.tsx` — Nav icon mapping
33. `src/app/(dashboard)/dashboard/page.tsx` — Stats cards, agent list, trending tokens, $ANSEM info
34. `src/app/(dashboard)/agents/page.tsx` — Agent cards, create dialog, chat dialog, delete
35. `src/app/(dashboard)/terminal/page.tsx` — Swap/DCA/Perps/Bridge tabs with quote flow
36. `src/app/(dashboard)/marketplace/page.tsx` — Token cards + table from ClawPump
37. `src/app/(dashboard)/signals/page.tsx` — $ANSEM signal + trending tokens feed
38. `src/app/(dashboard)/skills/page.tsx` — ClawPump + MoonPay skill registry + SKILL.md upload
39. `src/app/(dashboard)/settings/page.tsx` — API keys, wallets, OWS policies, Telegram config

#### Config & Artifacts
40. `src/app/layout.tsx` — Root layout with AnsemRail metadata
41. `src/app/globals.css` — Dark theme CSS
42. `skills/ansemrail-register/SKILL.md` — Full registration skill with dual-path instructions
43. `vercel.json` — Vercel deployment config
44. `.env.example` — Environment variable template
45. `.env` — Real env vars (gitignored)
46. `eslint.config.mjs` — ESLint config (relaxed no-explicit-any)
47. `README.md` — Comprehensive documentation

#### Build Verification ✅
- `npx tsc --noEmit` → 0 errors
- `npx eslint .` → 0 errors, 3 warnings (img element warnings only)
- `npx next build` → ✅ SUCCESS — 15 routes generated, compiles in 7.5s

---

## WHAT'S LEFT TO DO ❌

### Priority 1 — Database & Deployment

1. **Run Drizzle migrations** — `npx drizzle-kit push` to create tables in Neon PostgreSQL
   - The DATABASE_URL is in `.env` (gitignored)
   - This creates all tables: users, agents, registrations, listings, bids, signals, agent_signals, skills, ows_policies, sessions, accounts

2. **Deploy to Vercel**:
   ```bash
   npm i -g vercel
   vercel link
   # Set all env vars from .env:
   vercel env add CLAWPUMP_API_KEY production
   vercel env add DATABASE_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add ENCRYPTION_KEY production
   vercel env add HELIUS_API_KEY production
   vercel env add HELIUS_RPC_URL production
   vercel env add UPSTASH_REDIS_REST_URL production
   vercel env add UPSTASH_REDIS_REST_TOKEN production
   vercel env add TELEGRAM_BOT_TOKEN production
   vercel env add ANSEM_TOKEN_MINT production
   vercel env add OWS_WALLET_NAME production
   vercel env add NEXTAUTH_URL production
   vercel env add NEXT_PUBLIC_APP_URL production
   vercel --prod
   ```

3. **Set Telegram webhook** after deploy:
   ```bash
   curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://your-app.vercel.app/api/telegram"
   ```

### Priority 2 — Testing

4. **Test registration flows**:
   - POST to `/api/register/human` with email, wallet, cpk_ key
   - POST to `/api/register/agent` with Ed25519 public key + signature
   - POST to `/api/register/verify` to verify signatures

5. **Test agent management**:
   - GET `/api/agents` to list agents
   - POST `/api/agents` to create an agent
   - POST `/api/agents/chat` to chat with an agent

6. **Test swap quote**:
   - POST `/api/swap/quote` with input_mint, output_mint, amount

7. **Test Telegram bot**:
   - Set webhook, send /start, /ansem, /signals, /agents commands

### Priority 3 — Polish (Optional)

8. **Add Google OAuth credentials** — Currently GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are empty in .env
9. **Implement real wallet signing** — Terminal swap/DCA/perps buttons currently disabled (need wallet connection)
10. **Add real-time updates** — WebSocket or polling for signals page
11. **Add loading skeletons** — Better UX for slow API responses
12. **Add error boundaries** — Graceful error handling for API failures
13. **Responsive mobile nav** — Dashboard sidebar is hidden on mobile, needs a mobile menu
14. **Add auth middleware** — Protect dashboard routes, redirect to /register if not authenticated

### Priority 4 — Future Features

15. **AnsemRail marketplace listings** — Let users list/buy agents (DB tables already exist)
16. **Bidding system** — Bids on agent listings (DB table exists)
17. **Signal subscriptions** — Agent-signal subscription toggle (DB table exists)
18. **OWS policy CRUD** — Create/manage OWS policies from settings page
19. **Upstash Redis caching** — Rate limiting and caching for API calls

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
- **Build verified** — `npx next build` succeeds with all 15 routes.
- **.env is gitignored** — Never commit it. Contains all API keys.
- **The test commit** pushed UI components to verify GitHub push access works.

## SECURITY REMINDERS

- **NEVER commit `.env`** — it's in `.gitignore`
- **NEVER log API keys** — encrypt at rest with `src/lib/crypto.ts`
- **OWS keys never touch the LLM** — use Agent Access Layer
- **Rotate all credentials** after this project — they were shared in plaintext

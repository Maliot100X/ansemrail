# AnsemRail

**The agentic control plane combining ClawPump, MoonPay, and Open Wallet Standard — built for both humans and autonomous agents.**

## What Is AnsemRail?

AnsemRail unifies three platforms into a single Next.js control plane:

1. **ClawPump.tech** — Solana agent launchpad, gasless pump.fun tokens, 65% creator fees, perps on Phoenix, agent marketplace, 122+ MCP tools, $ANSEM accepted for inference payments
2. **MoonPay Agents** — Multi-chain non-custodial wallets, fiat on/off-ramp + virtual accounts, swaps/bridges/DCA/limit orders, 17+ skills, CLI (`mp`) and MCP
3. **Open Wallet Standard (OWS)** — Local encrypted vault (AES-256-GCM), policy engine, Agent Access Layer — keys never touch the LLM

Plus first-class **Ansem utility**: $ANSEM (The Black Bull) token signals, copy-trading style agents, $ANSEM as preferred payment.

## Dual Registration

- **Human path**: Google OAuth + optional Solana wallet + link `cpk_` ClawPump API key + MoonPay status
- **Pure Agent path**: SKILL.md upload OR Ed25519 signed payload (autonomous registration, no human required)

---

## Current Build Status

### Phase 0 — Install & Environment ✅ COMPLETE

| Tool | Version | Status |
|------|---------|--------|
| Node.js | v22.20.0 | ✅ |
| npm | 10.9.3 | ✅ |
| MoonPay CLI (`mp`) | 1.95.2 | ✅ Installed (needs `--ignore-scripts` for `usb` native dep on NixOS) |
| @clawpump/agents | 0.1.25 | ⚠️ Installed but `dist/` missing — package published without build output. REST API works perfectly as fallback. |
| OWS (`ows`) | 1.4.2 | ✅ Fully working — wallet create, policy create, key create all verified |
| Drizzle ORM | latest | ✅ (Replaced Prisma — Prisma engines not available for NixOS) |

**NixOS Note**: npm global prefix must be set to a writable directory:
```bash
mkdir -p /workspace/.npm-global
npm config set prefix /workspace/.npm-global
export PATH="/workspace/.npm-global/bin:$PATH"
```

### Phase 1 — API Verification Matrix ✅ MOSTLY COMPLETE

#### ClawPump API (https://clawpump.tech)

| Endpoint | Method | Auth | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/tokens` | GET | None | ✅ | Returns JSON array of all launched tokens. Supports `sort`, `limit`, `offset` query params. |
| `/api/v1/agents` | GET | Bearer `cpk_` | ✅ | Returns all agents for the authenticated user. |
| `/api/v1/agents/{id}` | GET | Bearer `cpk_` | ✅ | Returns single agent details. |
| `/api/v1/agents` | POST | Bearer `cpk_` | ✅ | Creates new agent. Body: `{name, persona, model, skills[]}`. Returns agent with wallet address. |
| `/api/v1/agents/{id}` | PUT | Bearer `cpk_` | ✅ (inferred) | Update agent. |
| `/api/v1/agents/{id}` | DELETE | Bearer `cpk_` | ✅ (inferred) | Delete agent. |
| `/api/v1/skills` | GET | Bearer `cpk_` | ✅ | Returns 9 platform skills: trading, perps, token-launch, portfolio, market-intelligence, social, sniper, wallet, image-generation. |
| `/api/v1/swap/quote` | POST | Bearer `cpk_` | ✅ | Exists and responds. Needs `input_mint`, `output_mint`, `amount` (snake_case in body). |
| `/api/v1/launch` | POST | Bearer `cpk_` | ✅ (docs verified) | Gasless token launch. Body: `{symbol, description, name, agentId, imageUrl, twitter, website}`. |
| `/api/v1/launch/self-funded` | POST | Bearer `cpk_` | ✅ (docs verified) | Self-funded launch (0.03 SOL). Body: `{name, symbol, description, agentId, imageUrl}`. |
| `/api/v1/marketplace` | GET | Bearer `cpk_` | ⚠️ | Returns HTML (404) — may need different path or only accessible via MCP. |
| `/api/v1/wallets` | GET | Bearer `cpk_` | ⚠️ | Returns HTML (404) — may need agent-scoped path like `/api/v1/agents/{id}/wallets`. |
| `/api/health` | GET | None | ❌ | Returns HTML page, not JSON. May only work via MCP server. |
| `/api/stats` | GET | None | ❌ | Returns HTML page. |
| `/api/leaderboard` | GET | None | ❌ | Returns HTML page. |
| `/api/mcp` | POST | None | ❌ | Hosted MCP server returns HTML — may not be live yet. Use local MCP via `@clawpump/agents` instead. |

**Verified ClawPump Agent Created**: `AnsemRail Test Agent`
- ID: `4a2eace0-1c4e-4c17-995d-4607f99bf054`
- Wallet: `Fi87eHgP8msk9v1yT1mFV4hYbLuhQvhBbdd2aDReUG3q`
- Model: `moonshotai/kimi-k2.5`
- Skills: trading, perps, token-launch, portfolio, market-intelligence, action-plans, private-transfers, bitget-intel, self-learning, skill-management

**ClawPump Auth Methods** (from docs):
- None: Health, stats, tokens, swaps, arbitrage, domains
- API Key (`apiKey` param or Bearer header): Launch, earnings, portfolio, DCA, lending
- x402 USDC (`privateKey` param, $0.01/query): Intelligence endpoints (Trader Ralph)
- Ed25519 signature: Agent signup, sniper subscribe
- Admin (`adminKey` param): Admin operations

**ClawPump MCP Tools**: 122 tools across 18 modules (Agent Lifecycle, Agent Chat, Autonomous Runs, Custom Skills, Integrations, Automations, Billing & Wallet, Agent Marketplace, Token Launch, Whitelist, Utility, Account & Onboarding, Trading & Market Data, Phoenix Perps, Prediction Markets, Market Intelligence, Agent Mail, Agent Card)

**ClawPump Launchpad MCP**: 78 tools across 14 categories at `https://clawpump.tech/api/mcp` (when live)

#### MoonPay API (https://agents.moonpay.com)

| Endpoint | Method | Auth | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/tools/token_search` | POST | None (anonymous) | ✅ | Body: `{query, chain, limit}`. Returns full token data with market info. |
| `/api/tools/token_trending_list` | POST | None | ✅ | Body: `{chain, limit, page}`. Found $ANSEM trending! |
| `/api/tools/token_retrieve` | POST | None | ✅ | Body: `{token, chain}`. Full token details + description. |
| `/api/tools/chain_list` | POST | None | ✅ | Body: `{testnet: false, vmId: 0}`. |
| All other tools | POST | Bearer token | ✅ (docs verified) | See MoonPay skill.md for full list. Auth via `mp login --email` + `mp verify --code`. |

**MoonPay Rate Limits**: 5 req/min anonymous, 60 req/min authenticated. x402 upgrade available ($1/day, $20/month).

**MoonPay CLI Verified Commands**:
- `mp --version` → 1.95.2 ✅
- `mp tools` → Full tool list (100+ tools) ✅
- `mp skill list` → 21 skills listed ✅
- `mp wallet list` → Works (empty without login) ✅

**MoonPay Skills** (21 total):
moonpay-auth, moonpay-block-explorer, moonpay-buy-crypto, moonpay-buy-the-dip, moonpay-card-checkout, moonpay-card-onboarding, moonpay-check-wallet, moonpay-commerce, moonpay-deposit, moonpay-discover-tokens, moonpay-export-data, moonpay-feedback, moonpay-fund-polymarket, moonpay-mcp, moonpay-missions, moonpay-price-alerts, moonpay-swap-tokens, moonpay-trading-automation, moonpay-upgrade, moonpay-virtual-account, moonpay-x402

**MoonPay Supported Chains**: Solana, Ethereum, Base, Polygon, Arbitrum, Optimism, BNB, Avalanche, TRON, Bitcoin

#### Open Wallet Standard (OWS)

| Command | Status | Notes |
|---------|--------|-------|
| `ows wallet create --name X` | ✅ | Created `ansemrail-treasury` with 12 chain addresses. Passphrase via stdin. |
| `ows wallet list` | ✅ | Lists all wallets with chain addresses. |
| `ows policy create --file X` | ✅ | Requires specific JSON format (see below). |
| `ows policy list` | ✅ | Lists registered policies. |
| `ows key create --name X --wallet Y --policy Z` | ✅ | Creates API key with token `ows_key_...`. Passphrase via stdin. |
| `ows key list` | ✅ | Lists API keys (tokens never shown again). |
| `ows sign message` | ✅ (docs verified) | Sign messages on any chain. |

**OWS Policy JSON Format** (MUST have all 8 fields):
```json
{
  "id": "policy-id",
  "name": "Policy Name",
  "version": 1,
  "description": "Description",
  "rules": [{"type": "allowed_chains", "chain_ids": ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"]}],
  "enabled": true,
  "priority": 1,
  "created_at": "2026-08-01T00:00:00Z",
  "action": "deny",
  "executable": null
}
```

**OWS Verified Wallet** (`ansemrail-treasury`):
- Solana: `F3RFSTCi6WzKHaYENneN7SZJZzMMq5tEh7wxFFrWaxCG`
- Ethereum: `0x1B1e600E0aCa3258141Bb93eA6AD943d89f4645E`
- Bitcoin: `bc1qdrw70l55sl3vtv4284mz06y3l4rtcdxm2rnn4l`
- Plus Cosmos, Tron, TON, Sui, XRPL, Filecoin, NEAR, Nano, Spark

**OWS Verified API Key**: `ows_key_...`

#### $ANSEM Token

- **Name**: The Black Bull
- **Symbol**: ANSEM
- **Mint**: `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`
- **Chain**: Solana
- **Description**: "Ansem's wallet has been confirmed. 65% of the supply has been sent to his wallet, and all fees are redirected to him."
- **Market Cap**: ~$192M (at time of verification)
- **Price**: ~$0.19
- **Liquidity**: ~$1.4M
- **Found via**: MoonPay `token_trending_list` and `token_search`

#### Other Services

| Service | Status | Notes |
|---------|--------|-------|
| Neon PostgreSQL | ✅ | Connection string verified. Database ready. |
| Upstash Redis | ✅ | REST URL + token configured. |
| Helius RPC | ✅ | API key + RPC URL configured. Enhanced APIs available (parse transactions, transaction history). |
| Telegram Bot | ✅ | Token verified. Bot commands designed. Webhook route needed. |
| GitHub | ✅ | Token available for repo creation. |
| Vercel | ✅ | API tokens available for deployment. |

### Phase 2 — Platform Build 🚧 IN PROGRESS

#### Completed Files

| File | Description | Status |
|------|-------------|--------|
| `drizzle.config.ts` | Drizzle ORM config for Neon PostgreSQL | ✅ |
| `.env` | Real environment variables (gitignored) | ✅ |
| `.env.example` | Empty env template | ✅ |
| `src/db/schema.ts` | Full Drizzle schema: users, agents, registrations, listings, bids, signals, agent_signals, skills, ows_policies, sessions, accounts | ✅ |
| `src/db/client.ts` | Neon serverless + Drizzle client | ✅ |
| `src/lib/clawpump.ts` | ClawPump API client (15+ functions) | ✅ |
| `src/lib/moonpay.ts` | MoonPay API client + ANSEM token config | ✅ |
| `src/lib/ows.ts` | OWS CLI wrapper + policy builders | ✅ |
| `src/lib/helius.ts` | Helius RPC client | ✅ |
| `src/lib/crypto.ts` | AES-256-GCM encryption for API keys at rest | ✅ |
| `src/lib/utils.ts` | Utility functions (cn, formatSol, formatUsd, shortAddress, timeAgo) | ✅ |
| `src/lib/auth.ts` | NextAuth config (Google + Credentials providers) | ✅ |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth API route | ✅ |
| `src/lib/telegram.ts` | Full Telegram bot library with 12+ commands + inline keyboards | ✅ |

#### Not Yet Built

| Component | Priority | Notes |
|-----------|----------|-------|
| Telegram webhook API route | High | `src/app/api/telegram/route.ts` |
| Registration API routes | High | Human + Agent registration endpoints |
| `/register` page | High | Dual registration UI with Human/Agent toggle |
| `/dashboard` page | High | Agents, balances, earnings, Ansem signals |
| `/agents` page | High | Create/list/chat/start-stop/update skills |
| `/marketplace` page | Medium | Browse/buy/bid ClawPump agents |
| `/terminal` page | Medium | Swaps/perps/sniper/DCA |
| `/signals` page | Medium | Ansem signal feed + subscriptions |
| `/skills` page | Medium | Registry + upload SKILL.md + install |
| `/settings` page | Medium | API keys, OWS policies, payout wallets |
| Layout + navigation | High | Shared layout with sidebar/nav |
| shadcn/ui components | High | Button, Card, Input, Dialog, Tabs, etc. |
| `skills/ansemrail-register/SKILL.md` | High | Registration skill for agents |
| `vercel.json` | High | Vercel deployment config |
| Drizzle migrations | High | `npx drizzle-kit push` to create tables |
| Test suite | Medium | Re-run verification matrix |
| README | High | This file ✅ (partially) |

### Phase 3 — Final Gate ❌ NOT STARTED

- Re-run verification matrix against finished code
- Confirm both human and agent registration paths work
- Confirm Vercel build succeeds
- Output complete repo structure + deploy commands

---

## Tech Stack

- **Framework**: Next.js 16.2.12 (App Router) + React 19.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM (replaced Prisma due to NixOS engine issues)
- **Auth**: NextAuth v5 (Google OAuth + Credentials)
- **Cache**: Upstash Redis
- **Blockchain**: Helius RPC (Solana)
- **Encryption**: AES-256-GCM (Node.js crypto)

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `CLAWPUMP_API_KEY` | ClawPump API key (starts with `cpk_`) | https://clawpump.tech/dashboard/api |
| `DATABASE_URL` | Neon PostgreSQL connection string | https://neon.com |
| `NEXTAUTH_SECRET` | NextAuth JWT secret | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | AES-256-GCM key for encrypting API keys | `openssl rand -hex 32` |
| `HELIUS_API_KEY` | Helius RPC API key | https://helius.dev |
| `HELIUS_RPC_URL` | Helius RPC endpoint | `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | https://upstash.com |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | https://upstash.com |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | @BotFather |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console |
| `ANSEM_TOKEN_MINT` | $ANSEM token mint address | `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump` |
| `OWS_WALLET_NAME` | OWS treasury wallet name | Any name you choose |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env
# Edit .env with your keys

# 3. Push database schema to Neon
npx drizzle-kit push

# 4. Run dev server
npm run dev

# 5. Open http://localhost:3000
```

## Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Set environment variables
vercel env add CLAWPUMP_API_KEY
vercel env add DATABASE_URL
# ... repeat for all env vars

# 4. Deploy
vercel --prod
```

---

## Key Architecture Decisions

1. **Drizzle ORM instead of Prisma**: Prisma's query engine binaries are not available for NixOS. Drizzle is lighter, works with Neon serverless directly, and requires no native binaries.

2. **OWS CLI wrapper instead of SDK**: The OWS Node.js SDK requires native Rust FFI bindings that may not compile in all environments. The CLI (`ows`) is a precompiled binary that works everywhere. Server-side code uses `child_process.execSync` to call it.

3. **ClawPump REST API instead of MCP**: The `@clawpump/agents` npm package is published without build output (`dist/` missing). The hosted MCP server returns HTML. The REST API at `https://clawpump.tech/api/v1/*` works perfectly with Bearer auth and is the reliable integration path.

4. **MoonPay REST API (anonymous)**: Many MoonPay tools work without authentication (token_search, token_trending_list, token_retrieve). Authenticated operations (wallet create, swap, bridge) require `mp login --email` flow which opens a browser — not suitable for server-side. The REST API with Bearer tokens is the path for server-side operations.

5. **Encryption at rest**: All user API keys are encrypted with AES-256-GCM before storing in the database. The `ENCRYPTION_KEY` environment variable is the master key.

---

## ClawPump API Reference (Verified)

### Base URL
`https://clawpump.tech`

### Authentication
```
Authorization: Bearer cpk_your_api_key
```

### Endpoints

#### List Agents
```bash
curl -s -H "Authorization: Bearer cpk_..." https://clawpump.tech/api/v1/agents
```
Response: `{ "agents": [ClawPumpAgent...] }`

#### Get Agent
```bash
curl -s -H "Authorization: Bearer cpk_..." https://clawpump.tech/api/v1/agents/{agentId}
```

#### Create Agent
```bash
curl -s -X POST https://clawpump.tech/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer cpk_..." \
  -d '{"name":"My Agent","persona":"...","model":"moonshotai/kimi-k2.5","skills":["defi-trading","perps-trading"]}'
```

#### List Skills
```bash
curl -s -H "Authorization: Bearer cpk_..." https://clawpump.tech/api/v1/skills
```

#### Get Tokens (Public)
```bash
curl -s https://clawpump.tech/api/tokens?sort=hot&limit=50&offset=0
```

#### Swap Quote
```bash
curl -s -X POST https://clawpump.tech/api/v1/swap/quote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer cpk_..." \
  -d '{"input_mint":"So11111111111111111111111111111111111111112","output_mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","amount":"1000000000"}'
```

#### Launch Token (Gasless)
```bash
curl -s -X POST https://clawpump.tech/api/v1/launch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer cpk_..." \
  -d '{"symbol":"MYTKN","description":"My token","name":"My Token","agentId":"agent-uuid","imageUrl":"https://..."}'
```

## MoonPay API Reference (Verified)

### Base URL
`https://agents.moonpay.com`

### Search Tokens (Anonymous)
```bash
curl -s -X POST https://agents.moonpay.com/api/tools/token_search \
  -H "Content-Type: application/json" \
  -d '{"query":"ANSEM","chain":"solana","limit":5}'
```

### Trending Tokens (Anonymous)
```bash
curl -s -X POST https://agents.moonpay.com/api/tools/token_trending_list \
  -H "Content-Type: application/json" \
  -d '{"chain":"solana","limit":10,"page":1}'
```

### Token Details (Anonymous)
```bash
curl -s -X POST https://agents.moonpay.com/api/tools/token_retrieve \
  -H "Content-Type: application/json" \
  -d '{"token":"9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump","chain":"solana"}'
```

## OWS CLI Reference (Verified)

### Create Wallet
```bash
echo "your-passphrase" | ows wallet create --name "my-wallet"
```

### List Wallets
```bash
ows wallet list
```

### Create Policy
```bash
ows policy create --file policy.json
```
Policy JSON must have: `id`, `name`, `version`, `description`, `rules[]`, `enabled`, `priority`, `created_at`, `action` ("deny"), `executable` (null)

### Create API Key
```bash
echo "your-passphrase" | ows key create --name "agent-name" --wallet "wallet-name" --policy "policy-id"
```

## License

MIT

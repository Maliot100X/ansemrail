---
name: ansemrail
version: 3.0.0
description: "The agentic control plane for Solana. Launch gasless pump.fun tokens, trade perps on Phoenix, swap via Jupiter, manage non-custodial wallets, get $ANSEM signals, and earn 65% creator fees. Register as human or autonomous agent. Real API calls — no mocks."
tags: [ansemrail, clawpump, moonpay, paybox, ows, solana, defi, agents, launchpad, perps, swaps, signals, ansem]
metadata:
  openclaw:
    emoji: "🐂"
    homepage: https://ansemrail.vercel.app
    requires:
      bins: []
    install:
      - kind: node
        package: "tweetnacl"
        bins: []
      - kind: node
        package: "bs58"
        bins: []
---

# AnsemRail

**The agentic control plane combining ClawPump, MoonPay, PayBox, and Open Wallet Standard — built for both humans and autonomous agents.**

**Base URL:** `https://ansemrail.vercel.app`

## What is AnsemRail?

AnsemRail unifies four platforms into a single Next.js control plane:

- **ClawPump.tech** — Solana agent launchpad, gasless pump.fun tokens, 65% creator fees, perps on Phoenix, agent marketplace, 122+ MCP tools
- **MoonPay Agents** — Multi-chain non-custodial wallets, fiat on/off-ramp, swaps/bridges/DCA/limit orders, 17+ skills
- **PayBox** — Non-custodial agent wallet with spending limits, signing, and authentication via MCP
- **Open Wallet Standard (OWS)** — Local encrypted vault (AES-256-GCM), policy engine, Agent Access Layer — keys never touch the LLM

Plus first-class **$ANSEM (The Black Bull)** utility: token signals, $ANSEM as preferred payment for inference, 65% of fees redirected to Ansem.

## Quick Start

### Option A: Human Registration (REST API)

```bash
# 1. Register as a human
curl -X POST https://ansemrail.vercel.app/api/register/human \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "walletAddress": "YOUR_SOLANA_WALLET",
    "clawpumpApiKey": "cpk_your_key",
    "moonpayEmail": "you@example.com"
  }'
# Response: { "userId": "uuid", "message": "Human registered successfully" }

# 2. Save your userId — you'll need it for settings and agent management

# 3. Update settings (payout wallet, $ANSEM preference)
curl -X PUT https://ansemrail.vercel.app/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "payoutWallet": "YOUR_SOLANA_WALLET",
    "ansemPreference": true
  }'

# 4. Create your first ClawPump agent
curl -X POST https://ansemrail.vercel.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Trading Agent",
    "persona": "A skilled Solana DeFi trading agent",
    "model": "moonshotai/kimi-k2.5",
    "skills": ["defi-trading", "perps-trading", "token-launch", "market-intelligence"]
  }'

# 5. Chat with your agent
curl -X POST https://ansemrail.vercel.app/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "AGENT_UUID_FROM_STEP_4",
    "message": "What is the current $ANSEM price?"
  }'

# 6. Get a swap quote (real Jupiter)
curl -X POST https://ansemrail.vercel.app/api/swap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
    "amount": "1000000000"
  }'

# 7. Check wallet balance (Helius RPC)
curl -s "https://ansemrail.vercel.app/api/wallet/balance?address=YOUR_WALLET"

# 8. View the dashboard
# Open https://ansemrail.vercel.app/dashboard in your browser
```

### Option B: Autonomous Agent Registration (Ed25519 — No Human Required)

```bash
# 1. Generate an Ed25519 keypair
node -e "
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const kp = nacl.sign.keyPair();
const msg = 'ansemrail-register-' + Date.now();
const sig = nacl.sign.detached(new TextEncoder().encode(msg), kp.secretKey);
console.log(JSON.stringify({
  publicKey: bs58.default.encode(kp.publicKey),
  signature: bs58.default.encode(sig),
  message: msg,
  secretKey: Buffer.from(kp.secretKey).toString('hex')
}));
"

# 2. Register using the publicKey, signature, and message from step 1
curl -X POST https://ansemrail.vercel.app/api/register/agent \
  -H "Content-Type: application/json" \
  -d '{
    "ed25519PublicKey": "BASE58_PUBLIC_KEY",
    "ed25519Signature": "BASE58_SIGNATURE",
    "name": "My Autonomous Agent"
  }'
# Response: { "agentId": "uuid", "agentToken": "hex_token", "message": "..." }
# SAVE THE agentToken — it's shown only once!

# 3. Verify a signature (utility)
curl -X POST https://ansemrail.vercel.app/api/register/verify \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "BASE58_PUBLIC_KEY",
    "signature": "BASE58_SIGNATURE",
    "message": "the-signed-message"
  }'
# Response: { "valid": true, "publicKey": "...", "message": "..." }

# 4. List all agents on the platform
curl -s https://ansemrail.vercel.app/api/agents | jq .

# 5. Create a ClawPump agent
curl -X POST https://ansemrail.vercel.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alpha Hunter",
    "persona": "Snipe new token launches and trade with $ANSEM preference",
    "model": "moonshotai/kimi-k2.5",
    "skills": ["defi-trading", "perps-trading", "sniper", "market-intelligence"]
  }'

# 6. Chat with any agent
curl -X POST https://ansemrail.vercel.app/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId": "AGENT_UUID", "message": "Find me trending tokens on Solana"}'
```

### Option C: Web Dashboard

1. Visit **https://ansemrail.vercel.app/register**
2. Choose **"I am a Human"** or **"I am an Agent"** tab
3. Fill in the form and submit
4. Your userId is saved to localStorage automatically
5. Navigate to dashboard, agents, terminal, marketplace, signals, skills, settings

---

## Authentication

**Human path:** Register with email + Solana wallet + ClawPump API key (`cpk_`). API keys are encrypted at rest with AES-256-GCM. Get your ClawPump key at https://clawpump.tech/dashboard/api.

**Agent path (autonomous):** Sign a message with an Ed25519 keypair and submit the public key + signature. No human required. The platform verifies the signature cryptographically and issues an `agentToken`.

**Agent path (SKILL.md):** Submit a SKILL.md file content with YAML frontmatter. The platform parses it and registers the agent.

**No auth required for:** Public token data, agent listing, swap quotes, wallet balance checks.

---

## Two Registration Paths

### Path 1: Human Registration

For humans who want to manage agents, trade, and earn 65% creator fees on ClawPump.

**What you need:**
- Email address (required)
- Solana wallet address (recommended)
- ClawPump API key starting with `cpk_` (recommended — get it at https://clawpump.tech/dashboard/api)
- MoonPay email (optional — for fiat on/off-ramp)

**Steps:**

1. **Get a ClawPump API Key** — Go to https://clawpump.tech/dashboard/api and generate a key starting with `cpk_`
2. **Register on AnsemRail:**
   ```bash
   curl -X POST https://ansemrail.vercel.app/api/register/human \
     -H "Content-Type: application/json" \
     -d '{"email":"you@example.com","walletAddress":"YOUR_WALLET","clawpumpApiKey":"cpk_your_key"}'
   ```
3. **Save settings:**
   ```bash
   curl -X PUT https://ansemrail.vercel.app/api/settings \
     -H "Content-Type: application/json" \
     -d '{"userId":"YOUR_USER_ID","payoutWallet":"YOUR_WALLET","ansemPreference":true}'
   ```
4. **Access dashboard** at https://ansemrail.vercel.app/dashboard

### Path 2: Agent Registration (Autonomous — No Human Required)

**Option A: Ed25519 Signature (Recommended for Solana agents)**

1. Generate an Ed25519 keypair (see Quick Start Option B)
2. Sign a message: `ansemrail-register-{timestamp}`
3. POST to `/api/register/agent` with `ed25519PublicKey`, `ed25519Signature`, and `name`
4. Save the `agentToken` from the response — shown only once

**Option B: SKILL.md Upload**

1. Create a SKILL.md with YAML frontmatter (name, description, version, tags)
2. POST to `/api/register/agent` with `skillMdContent` and `name`

---

## Core Features

### Agent Management (ClawPump)

Launch, manage, and chat with AI agents on Solana. Each agent gets its own wallet address and can be assigned skills.

```bash
# List all agents
curl -s https://ansemrail.vercel.app/api/agents | jq .

# Create an agent
curl -X POST https://ansemrail.vercel.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Agent",
    "persona": "DeFi trading agent focused on Solana memecoins",
    "model": "moonshotai/kimi-k2.5",
    "skills": ["defi-trading", "perps-trading", "token-launch", "market-intelligence"]
  }'

# Chat with an agent
curl -X POST https://ansemrail.vercel.app/api/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AGENT_UUID","message":"What tokens are trending?"}'

# Delete an agent
curl -X DELETE "https://ansemrail.vercel.app/api/agents?id=AGENT_UUID"
```

**Agent fields:**
- `id` — UUID
- `name` — Display name
- `status` — `running` or `stopped`
- `walletAddress` — Solana wallet address for the agent
- `skills` — Array of skill slugs
- `model` — LLM model (e.g. `moonshotai/kimi-k2.5`)
- `persona` — System prompt / personality

### Swap Quotes (Jupiter)

Get real swap quotes from Jupiter aggregator. No authentication required.

```bash
# SOL → USDC
curl -X POST https://ansemrail.vercel.app/api/swap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amount": "1000000000"
  }'

# SOL → ANSEM
curl -X POST https://ansemrail.vercel.app/api/swap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
    "amount": "1000000000"
  }'
```

**Response:**
```json
{
  "status": "quoted",
  "venue": "jupiter",
  "swapMode": "ExactIn",
  "input": { "token": "SOL", "mint": "...", "amount": "1", "rawAmount": "1000000000", "decimals": 9 },
  "output": { "token": "USDC", "mint": "...", "amount": "71.93", "rawAmount": "71936267", "decimals": 6 },
  "slippageBps": 50,
  "priceImpactPct": "0",
  "route": ["HumidiFi", "Deriverse"]
}
```

**Common token mints:**
- SOL: `So11111111111111111111111111111111111111112`
- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- ANSEM: `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`

### Wallet Balance (Helius)

Check SOL and token balances for any Solana wallet address via Helius RPC.

```bash
curl -s "https://ansemrail.vercel.app/api/wallet/balance?address=WALLET_ADDRESS" | jq .
```

**Response:**
```json
{
  "address": "Fi87eHgP8msk9v1yT1mFV4hYbLuhQvhBbdd2aDReUG3q",
  "solBalance": 0,
  "solBalanceLamports": 0,
  "tokens": []
}
```

### Settings Management

Store encrypted API keys, payout wallets, Telegram chat ID, OWS wallet name, and $ANSEM preference.

```bash
# Get settings
curl -s "https://ansemrail.vercel.app/api/settings?userId=YOUR_USER_ID" | jq .

# Update settings
curl -X PUT https://ansemrail.vercel.app/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "clawpumpApiKey": "cpk_new_key",
    "moonpayEmail": "you@example.com",
    "payoutWallet": "NEW_WALLET",
    "telegramChatId": "123456789",
    "owsWalletName": "my-treasury",
    "ansemPreference": true
  }'
```

All API keys are encrypted at rest with AES-256-GCM. The GET response shows `hasClawpumpKey: true/false` — never the raw key.

### Skills Registry

Browse and save skills from ClawPump and MoonPay ecosystems.

```bash
# List all saved skills
curl -s https://ansemrail.vercel.app/api/skills | jq .

# Save a new skill
curl -X POST https://ansemrail.vercel.app/api/skills \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ansem Trading Bot",
    "slug": "ansem-trading-bot",
    "description": "Auto-trading with $ANSEM preference",
    "tags": ["trading", "solana", "defi"]
  }'

# Delete a skill
curl -X DELETE "https://ansemrail.vercel.app/api/skills?id=SKILL_UUID"
```

### PayBox Integration (MCP)

Non-custodial agent wallet with spending limits, signing, and authentication via MCP.

```bash
# List PayBox info and available actions
curl -s https://ansemrail.vercel.app/api/paybox | jq .

# List tools (via query param)
curl -s "https://ansemrail.vercel.app/api/paybox?action=tools" | jq .

# Create a vault
curl -X POST https://ansemrail.vercel.app/api/paybox \
  -H "Content-Type: application/json" \
  -d '{"action":"createVault","name":"my-vault","passphrase":"your_passphrase"}'

# Sign a message
curl -X POST https://ansemrail.vercel.app/api/paybox \
  -H "Content-Type: application/json" \
  -d '{"action":"sign","vaultId":"VAULT_ID","message":"hello","passphrase":"your_passphrase"}'

# Create Ansem-only policy (restricts to $ANSEM, SOL, USDC on Solana)
curl -X POST https://ansemrail.vercel.app/api/paybox \
  -H "Content-Type: application/json" \
  -d '{"action":"createAnsemPolicy"}'

# Create spend limit policy
curl -X POST https://ansemrail.vercel.app/api/paybox \
  -H "Content-Type: application/json" \
  -d '{"action":"createSpendLimit","maxPerTx":10,"maxPerDay":100}'
```

**Note:** PayBox MCP endpoint at `app.paybox.sh/mcp` may return 404 if the external service is not yet live. The integration code is ready and will work once PayBox is available.

### Telegram Bot

Full command interface with inline keyboards.

**Commands:**
- `/start` — Welcome message with inline keyboard
- `/help` — Show all commands
- `/ansem` — $ANSEM token info (live price from MoonPay)
- `/signals` — Trending tokens on Solana
- `/agents` — List your ClawPump agents
- `/createagent` — Create a new agent
- `/swap` — Swap info
- `/marketplace` — Hot tokens from ClawPump
- `/register` — Registration info
- `/dashboard` — Dashboard link
- `/settings` — Settings link

**Set webhook after getting a valid bot token:**
```bash
curl -s "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://ansemrail.vercel.app/api/telegram"
```

---

## $ANSEM Token

- **Symbol:** ANSEM
- **Name:** The Black Bull
- **Mint:** `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump`
- **Chain:** Solana
- **Utility:** Preferred payment for ClawPump inference, signals, copy-trading
- **Description:** "Ansem's wallet has been confirmed. 65% of the supply has been sent to his wallet, and all fees are redirected to him."

**Get $ANSEM token data via MoonPay API:**
```bash
curl -X POST https://agents.moonpay.com/api/tools/token_retrieve \
  -H "Content-Type: application/json" \
  -d '{"token":"9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump","chain":"solana"}'
```

**Swap SOL for $ANSEM via AnsemRail:**
```bash
curl -X POST https://ansemrail.vercel.app/api/swap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
    "amount": "1000000000"
  }'
```

---

## ClawPump Skills to Enable

After registration, enable these ClawPump skills for your agents:

| Skill | Description |
|-------|-------------|
| `defi-trading` | Swap, DCA, portfolio management |
| `perps-trading` | Phoenix perps (long/short with leverage) |
| `token-launch` | Gasless pump.fun token launches |
| `market-intelligence` | Token analysis, trending, signals |
| `sniper` | Snipe new token launches |
| `portfolio` | Track and manage portfolio |
| `social` | Social signals and sentiment |
| `wallet` | Wallet management |
| `image-generation` | Generate images for tokens |
| `x402` | x402 payment protocol |

## MoonPay Skills to Enable

| Skill | Description |
|-------|-------------|
| `moonpay-swap-tokens` | Multi-chain token swaps |
| `moonpay-trading-automation` | DCA, limit orders, buy-the-dip |
| `moonpay-buy-crypto` | Fiat on/off-ramp |
| `moonpay-card-checkout` | Card payments |
| `moonpay-price-alerts` | Price alert notifications |
| `moonpay-discover-tokens` | Token discovery |
| `moonpay-virtual-account` | Fiat on-ramp with KYC |
| `moonpay-deposit` | Multi-chain deposit links |

---

## Open Wallet Standard (OWS)

Local encrypted vault with policy engine. Keys never touch the LLM — the Agent Access Layer handles signing.

```bash
# Create a wallet (12 chain addresses generated)
echo "your-passphrase" | ows wallet create --name "ansemrail-treasury"

# List wallets
ows wallet list

# Create a policy (must have all 8 fields)
ows policy create --file policy.json
# policy.json: { "id", "name", "version", "description", "rules", "enabled", "priority", "created_at", "action": "deny", "executable": null }

# Create an API key
echo "your-passphrase" | ows key create --name "agent-name" --wallet "wallet-name" --policy "policy-id"

# Sign a message
ows sign message
```

**OWS Policy JSON format (all 8 fields required):**
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

---

## Dashboard Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Hero, features, CTA |
| Register | `/register` | Dual registration (Human/Agent) |
| Dashboard | `/dashboard` | Stats, agents, trending, $ANSEM info |
| Agents | `/agents` | Create, manage, chat with agents |
| Terminal | `/terminal` | Swap, DCA, Perps, Bridge tabs |
| Marketplace | `/marketplace` | Token cards from ClawPump |
| Signals | `/signals` | $ANSEM signal + trending feed |
| Skills | `/skills` | ClawPump + MoonPay skill registry |
| Settings | `/settings` | API keys, wallets, OWS, Telegram |

---

## Supported Chains (via MoonPay)

| Chain | Chain ID | Features |
|-------|----------|----------|
| Solana | `solana` | Full trading, swaps, DCA, $ANSEM |
| Ethereum | `ethereum` | Swap, bridge, transfer |
| Base | `base` | Swap, bridge, transfer |
| Polygon | `polygon` | Swap, bridge, transfer |
| Arbitrum | `arbitrum` | Swap, bridge, transfer |
| Optimism | `optimism` | Swap, bridge, transfer |
| BNB | `bnb` | Swap, bridge, transfer |
| Avalanche | `avalanche` | Swap, bridge, transfer |
| TRON | `tron` | Wallet addresses |
| Bitcoin | `bitcoin` | Balance, bridges |

---

## Tips for Agents

- **Register first** — Get a `userId` (human) or `agentToken` (agent) before using platform features
- **Save your tokens** — `agentToken` is shown only once at registration. Store it securely
- **Use real token mints** — SOL: `So111...12`, USDC: `EPjF...Dt1v`, ANSEM: `9cRC...pump`
- **Swap quotes are free** — No auth needed for `/api/swap/quote`
- **Agent chat is real** — `/api/agents/chat` calls real ClawPump LLM inference
- **Encrypt your keys** — ClawPump API keys are AES-256-GCM encrypted at rest
- **$ANSEM preference** — Set `ansemPreference: true` in settings to use $ANSEM as preferred payment
- **Check balances before trading** — Use `/api/wallet/balance` to verify funds
- **Use OWS for signing** — Non-custodial wallets keep keys in a local encrypted vault
- **Keys never touch the LLM** — The Agent Access Layer handles all signing

---

## Safety Rules

- **NEVER expose your API keys** — encrypt at rest, use Bearer headers only
- **NEVER share your agent token** — it's shown once at registration
- **Use OWS/PayBox for signing** — Non-custodial wallets keep keys in a local encrypted vault
- **Keys never touch the LLM** — the Agent Access Layer handles signing
- **$ANSEM as preferred payment** — 65% of fees go to Ansem, use $ANSEM for inference
- **Rotate all credentials** after project setup

---

## Complete API Endpoint Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/register/human` | POST | None | Register a human user |
| `/api/register/agent` | POST | None | Register an autonomous agent (Ed25519 or SKILL.md) |
| `/api/register/verify` | POST | None | Verify an Ed25519 signature |
| `/api/agents` | GET | None | List all ClawPump agents |
| `/api/agents` | POST | `cpk_` | Create a ClawPump agent |
| `/api/agents?id=X` | DELETE | `cpk_` | Delete an agent |
| `/api/agents/chat` | POST | `cpk_` | Chat with an agent (real LLM) |
| `/api/swap/quote` | POST | None | Get a swap quote (real Jupiter) |
| `/api/wallet/balance` | GET | None | Get SOL + token balance (Helius) |
| `/api/settings` | GET | userId | Get user settings |
| `/api/settings` | PUT | userId | Update settings (keys encrypted) |
| `/api/skills` | GET | None | List saved skills |
| `/api/skills` | POST | None | Save a new skill |
| `/api/skills?id=X` | DELETE | None | Delete a skill |
| `/api/paybox` | GET | None | PayBox MCP info/tools/vaults |
| `/api/paybox` | POST | None | PayBox create vault/sign/policy |
| `/api/telegram` | GET | None | Telegram webhook status |
| `/api/telegram` | POST | Telegram | Telegram webhook endpoint |
| `/api/auth/[...nextauth]` | GET/POST | Session | NextAuth (Google + Credentials) |

---

## Tech Stack

- **Next.js 16.2.12** (App Router, Turbopack)
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS v4**
- **Drizzle ORM 0.45** + Neon PostgreSQL (serverless)
- **NextAuth v4** (Google + Credentials providers)
- **Radix UI** (Dialog, Select, Switch, Tabs, Label)
- **tweetnacl + bs58** (Ed25519 signature verification)
- **lucide-react** (icons)
- **Helius RPC** (Solana blockchain data)
- **Jupiter** (swap aggregation)
- **Vercel** (deployment)

---

## Links

- **Web App:** https://ansemrail.vercel.app
- **Dashboard:** https://ansemrail.vercel.app/dashboard
- **Register:** https://ansemrail.vercel.app/register
- **GitHub:** https://github.com/Maliot100X/ansemrail
- **ClawPump:** https://clawpump.tech
- **MoonPay:** https://agents.moonpay.com
- **PayBox:** https://app.paybox.sh
- **$ANSEM Token:** `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump` (Solana)

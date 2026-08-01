const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export async function telegramRequest(
  method: string,
  params: Record<string, unknown> = {}
): Promise<any> {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram ${method}: ${res.status} ${text}`);
  }
  return res.json();
}

export async function sendMessage(
  chatId: string | number,
  text: string,
  keyboard?: any
): Promise<any> {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: keyboard,
  });
}

export async function setWebhook(url: string): Promise<any> {
  return telegramRequest("setWebhook", { url });
}

export async function getWebhookInfo(): Promise<any> {
  return telegramRequest("getWebhookInfo");
}

export async function deleteWebhook(): Promise<any> {
  return telegramRequest("deleteWebhook");
}

export async function getMe(): Promise<any> {
  return telegramRequest("getMe");
}

export async function sendPhoto(
  chatId: string | number,
  photo: string,
  caption?: string
): Promise<any> {
  return telegramRequest("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML",
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<any> {
  return telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📊 Dashboard", callback_data: "dashboard" },
        { text: "🤖 Agents", callback_data: "agents" },
      ],
      [
        { text: "📈 Terminal", callback_data: "terminal" },
        { text: "🔔 Signals", callback_data: "signals" },
      ],
      [
        { text: "🛒 Marketplace", callback_data: "marketplace" },
        { text: "⚙️ Settings", callback_data: "settings" },
      ],
      [
        { text: "$ANSEM Info", callback_data: "ansem" },
        { text: "❓ Help", callback_data: "help" },
      ],
    ],
  };
}

export async function handleTelegramUpdate(update: any): Promise<void> {
  const msg = update.message || update.callback_query?.message;
  const chatId = msg?.chat?.id;
  if (!chatId) return;

  if (update.callback_query) {
    await answerCallbackQuery(update.callback_query.id);
    const data = update.callback_query.data;

    switch (data) {
      case "dashboard":
        await sendMessage(
          chatId,
          "📊 <b>AnsemRail Dashboard</b>\n\nYour agents, balances, and earnings at a glance. Visit the web dashboard for full details.",
          mainKeyboard()
        );
        break;
      case "agents":
        await sendMessage(
          chatId,
          "🤖 <b>Agents</b>\n\nCreate, manage, and chat with your ClawPump agents. Use /createagent to make a new one.",
          mainKeyboard()
        );
        break;
      case "terminal":
        await sendMessage(
          chatId,
          "📈 <b>Trading Terminal</b>\n\nSwap, bridge, DCA, and trade perps via ClawPump + MoonPay. Use /swap to get started.",
          mainKeyboard()
        );
        break;
      case "signals":
        await sendMessage(
          chatId,
          "🔔 <b>Ansem Signals</b>\n\nLive signals from @blknoiz06 and related feeds. Use /signals to get the latest.",
          mainKeyboard()
        );
        break;
      case "marketplace":
        await sendMessage(
          chatId,
          "🛒 <b>Marketplace</b>\n\nBrowse and buy AI agents with wallets, skills, and track records. Use /marketplace to browse.",
          mainKeyboard()
        );
        break;
      case "settings":
        await sendMessage(
          chatId,
          "⚙️ <b>Settings</b>\n\nManage API keys, OWS policies, payout wallets, and $ANSEM preference. Use /settings.",
          mainKeyboard()
        );
        break;
      case "ansem": {
        const { getAnsemTokenInfo } = await import("@/lib/moonpay");
        try {
          const info = await getAnsemTokenInfo();
          await sendMessage(
            chatId,
            `🐂 <b>$ANSEM — The Black Bull</b>\n\n` +
              `💰 Price: $${info.marketData.price.toFixed(6)}\n` +
              `📊 Market Cap: $${(info.marketData.marketCap / 1e6).toFixed(2)}M\n` +
              `💧 Liquidity: $${(info.marketData.liquidity / 1e6).toFixed(2)}M\n` +
              `📝 ${info.description || "Ansem's wallet confirmed. 65% supply sent to him."}\n\n` +
              `Mint: <code>${info.address}</code>`,
            mainKeyboard()
          );
        } catch {
          await sendMessage(
            chatId,
            "🐂 <b>$ANSEM — The Black Bull</b>\n\nMint: <code>9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump</code>\n\nAnsem's wallet has been confirmed. 65% of the supply has been sent to his wallet, and all fees are redirected to him.",
            mainKeyboard()
          );
        }
        break;
      }
      case "help":
        await sendMessage(
          chatId,
          "❓ <b>AnsemRail Bot Help</b>\n\n" +
            "Commands:\n" +
            "/start - Start the bot\n" +
            "/dashboard - View dashboard\n" +
            "/agents - List your agents\n" +
            "/createagent - Create a new agent\n" +
            "/swap - Swap tokens\n" +
            "/signals - Get Ansem signals\n" +
            "/marketplace - Browse marketplace\n" +
            "/ansem - $ANSEM token info\n" +
            "/register - Register on AnsemRail\n" +
            "/settings - View settings\n" +
            "/help - Show this help\n\n" +
            "Web: https://ansemrail.vercel.app",
          mainKeyboard()
        );
        break;
    }
    return;
  }

  const text = update.message?.text || "";

  if (text === "/start") {
    await sendMessage(
      chatId,
      "🚀 <b>Welcome to AnsemRail!</b>\n\n" +
        "The agentic control plane combining ClawPump, MoonPay, and Open Wallet Standard.\n\n" +
        "Choose an option below 👇",
      mainKeyboard()
    );
  } else if (text === "/help") {
    await sendMessage(
      chatId,
      "❓ <b>AnsemRail Bot Help</b>\n\n" +
        "Commands:\n" +
        "/start - Start the bot\n" +
        "/dashboard - View dashboard\n" +
        "/agents - List your agents\n" +
        "/createagent - Create a new agent\n" +
        "/swap - Swap tokens\n" +
        "/signals - Get Ansem signals\n" +
        "/marketplace - Browse marketplace\n" +
        "/ansem - $ANSEM token info\n" +
        "/register - Register on AnsemRail\n" +
        "/settings - View settings\n" +
        "/help - Show this help",
      mainKeyboard()
    );
  } else if (text === "/ansem") {
    const { getAnsemTokenInfo } = await import("@/lib/moonpay");
    try {
      const info = await getAnsemTokenInfo();
      await sendMessage(
        chatId,
        `🐂 <b>$ANSEM — The Black Bull</b>\n\n` +
          `💰 Price: $${info.marketData.price.toFixed(6)}\n` +
          `📊 Market Cap: $${(info.marketData.marketCap / 1e6).toFixed(2)}M\n` +
          `💧 Liquidity: $${(info.marketData.liquidity / 1e6).toFixed(2)}M\n` +
          `📝 ${info.description}\n\n` +
          `Mint: <code>${info.address}</code>`,
        mainKeyboard()
      );
    } catch {
      await sendMessage(
        chatId,
        "🐂 <b>$ANSEM — The Black Bull</b>\n\nMint: <code>9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump</code>",
        mainKeyboard()
      );
    }
  } else if (text === "/signals") {
    const { getTrendingTokens } = await import("@/lib/moonpay");
    try {
      const tokens = await getTrendingTokens("solana", 5, 1);
      let msg = "🔔 <b>Trending on Solana</b>\n\n";
      for (const t of tokens) {
        const change = t.marketData.priceChangePercent["24h"];
        const emoji = change > 0 ? "🟢" : "🔴";
        msg += `${emoji} <b>$${t.symbol}</b> — $${t.marketData.price.toFixed(8)} (${(change * 100).toFixed(2)}%)\n`;
      }
      await sendMessage(chatId, msg, mainKeyboard());
    } catch {
      await sendMessage(chatId, "Could not fetch trending tokens right now.", mainKeyboard());
    }
  } else if (text === "/marketplace") {
    const { getTokens } = await import("@/lib/clawpump");
    try {
      const tokens = await getTokens("hot", 5, 0);
      let msg = "🛒 <b>ClawPump Marketplace — Hot Tokens</b>\n\n";
      for (const t of tokens) {
        msg += `🔥 <b>$${t.symbol}</b> — ${t.name}\n`;
        msg += `   MCap: $${(t.marketCap / 1e6).toFixed(2)}M | Vol24h: $${(t.volume24h / 1e3).toFixed(0)}K\n`;
        msg += `   Agent: ${t.agentName}\n\n`;
      }
      await sendMessage(chatId, msg, mainKeyboard());
    } catch {
      await sendMessage(chatId, "Could not fetch marketplace right now.", mainKeyboard());
    }
  } else if (text === "/agents") {
    const { listAgents } = await import("@/lib/clawpump");
    try {
      const agents = await listAgents();
      let msg = "🤖 <b>Your ClawPump Agents</b>\n\n";
      for (const a of agents.slice(0, 5)) {
        const status = a.status === "running" ? "🟢" : "🔴";
        msg += `${status} <b>${a.name}</b>\n`;
        msg += `   Model: ${a.model}\n`;
        msg += `   Wallet: <code>${a.walletAddress?.slice(0, 8)}...</code>\n`;
        msg += `   Skills: ${a.skills?.length || 0} active\n\n`;
      }
      await sendMessage(chatId, msg, mainKeyboard());
    } catch {
      await sendMessage(chatId, "Could not fetch agents. Make sure CLAWPUMP_API_KEY is set.", mainKeyboard());
    }
  } else if (text?.startsWith("/createagent")) {
    await sendMessage(
      chatId,
      "🤖 <b>Create Agent</b>\n\nTo create a new ClawPump agent, visit:\nhttps://ansemrail.vercel.app/agents\n\nOr use the web dashboard for full control.",
      mainKeyboard()
    );
  } else if (text === "/register") {
    await sendMessage(
      chatId,
      "📝 <b>Register on AnsemRail</b>\n\n" +
        "Two paths:\n\n" +
        "👤 <b>Human:</b> Google OAuth + wallet + cpk_ key\n" +
        "🤖 <b>Agent:</b> SKILL.md upload or Ed25519 signed payload\n\n" +
        "Visit: https://ansemrail.vercel.app/register",
      mainKeyboard()
    );
  } else if (text === "/dashboard") {
    await sendMessage(
      chatId,
      "📊 <b>Dashboard</b>\n\nVisit the web dashboard for full view:\nhttps://ansemrail.vercel.app/dashboard",
      mainKeyboard()
    );
  } else if (text === "/settings") {
    await sendMessage(
      chatId,
      "⚙️ <b>Settings</b>\n\nManage your settings at:\nhttps://ansemrail.vercel.app/settings",
      mainKeyboard()
    );
  } else if (text?.startsWith("/swap")) {
    await sendMessage(
      chatId,
      "📈 <b>Swap</b>\n\nUse the terminal for swaps:\nhttps://ansemrail.vercel.app/terminal\n\n" +
        "Or use MoonPay CLI:\n<code>mp token swap --wallet main --chain solana --from-token SOL --from-amount 0.1 --to-token USDC</code>",
      mainKeyboard()
    );
  } else {
    await sendMessage(
      chatId,
      "Welcome to AnsemRail Bot! Use /help to see all commands.",
      mainKeyboard()
    );
  }
}

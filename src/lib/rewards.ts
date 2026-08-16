import { createHash } from "crypto";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import bs58 from "bs58";
import { getBalance, getTokenAccountsByOwner } from "@/lib/helius";

export const ANSEM_MINT = process.env.ANSEM_TOKEN_MINT || "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";
export const CLAW_MINT = process.env.CLAW_TOKEN_MINT || "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump";
export const PROJECT_MINT = "7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene"; // CLAWRENA
export const PROJECT_SYMBOL = "CLAWRENA";
export const TWITTER_HANDLE = "CLAWRENAi";
export const TWITTER_URL = "https://x.com/CLAWRENAi";
export const TOKEN2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export function treasureWalletAddress(): string | null {
  return process.env.TREASURY_WALLET_ADDRESS || null;
}

export function getTreasuryKeypair(): Keypair | null {
  const pk = process.env.TREASURY_PRIVATE_KEY;
  if (!pk) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(pk));
  } catch {
    return null;
  }
}

export function proofHash(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

function getConnection(): Connection {
  const url = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
  return new Connection(url, "confirmed");
}

export async function getTokenDecimals(mint: string): Promise<number> {
  try {
    const conn = getConnection();
    const supply = await conn.getTokenSupply(new PublicKey(mint));
    return supply.value.decimals;
  } catch {
    return 6;
  }
}

export async function getWalletHolding(
  wallet: string,
  mint: string
): Promise<number> {
  const programId =
    mint === PROJECT_MINT ? TOKEN2022_PROGRAM : "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const accounts = await getTokenAccountsByOwner(wallet, programId);
  for (const acc of accounts) {
    const info = acc?.account?.data?.parsed?.info;
    if (info?.mint === mint) {
      const amount = Number(info.tokenAmount?.amount || 0);
      return amount;
    }
  }
  return 0;
}

export async function verifyHolding(
  wallet: string,
  mint: string,
  minBalanceBaseUnits: string
): Promise<{ ok: boolean; balance: number; min: number }> {
  const balance = await getWalletHolding(wallet, mint);
  const min = Number(minBalanceBaseUnits) || 0;
  return { ok: balance >= min, balance, min };
}

export async function verifyTwitterPost(
  url: string,
  expectedHandle: string
): Promise<{ ok: boolean; reachable: boolean; note: string }> {
  if (!/^https?:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+/i.test(url)) {
    return { ok: false, reachable: false, note: "Invalid X post link — must be a x.com/twitter.com status URL." };
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AnsemRail/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, reachable: false, note: `Post returned HTTP ${res.status} — not reachable.` };
    const text = (await res.text()).toLowerCase();
    const handleFound = text.includes(expectedHandle.toLowerCase());
    return {
      ok: handleFound,
      reachable: true,
      note: handleFound
        ? "Post is live and references the project handle. Final approval by admin before payout."
        : "Post is live but the project handle was not found in it.",
    };
  } catch (e: any) {
    return { ok: false, reachable: false, note: "Could not fetch the post (network/X blocking). Manual review required." };
  }
}

export async function sendSplReward(
  mint: string,
  toWallet: string,
  uiAmount: number
): Promise<string> {
  const keypair = getTreasuryKeypair();
  if (!keypair) throw new Error("TREASURY_PRIVATE_KEY is not set on the server");
  const conn = getConnection();
  const decimals = await getTokenDecimals(mint);
  const amountBase = BigInt(Math.round(uiAmount * 10 ** decimals));
  const mintPub = new PublicKey(mint);
  const toPub = new PublicKey(toWallet);
  const fromAta = await getAssociatedTokenAddress(mintPub, keypair.publicKey);
  const toAta = await getAssociatedTokenAddress(mintPub, toPub);

  const fromInfo = await conn.getAccountInfo(fromAta);
  if (!fromInfo) throw new Error("Treasury has no token account for this mint — fund the treasury first.");

  const tx = new Transaction();
  tx.add(createTransferInstruction(fromAta, toAta, keypair.publicKey, amountBase));
  tx.feePayer = keypair.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
  tx.sign(keypair);
  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction(sig, "confirmed");
  return sig;
}

export async function getTreasurySolBalance(): Promise<number> {
  const addr = treasureWalletAddress();
  if (!addr) return 0;
  try {
    const lamports = await getBalance(addr);
    return (lamports || 0) / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

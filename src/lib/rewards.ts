import { createHash } from "crypto";
import { db } from "@/db/client";
import { platformConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { createTransferInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
import { getBalance, getTokenAccountsByOwner } from "@/lib/helius";

export const ANSEM_MINT = process.env.ANSEM_TOKEN_MINT || "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";
export const CLAW_MINT = process.env.CLAW_TOKEN_MINT || "739dnZEG4yaBWFsY8L8ZwrfhGG6dhtCSercW8Umspump";
export const PROJECT_MINT = "7pkqvfHe6WREhvZ1ergfXtz3F6MQfXCfcAZiumCt6Ene"; // CLAWRENA
export const PROJECT_SYMBOL = "CLAWRENA";
export const TWITTER_HANDLE = "CLAWRENAi";
export const TWITTER_URL = "https://x.com/CLAWRENAi";
export const TOKEN2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export interface TreasuryConfig {
  address: string | null;
  hasKey: boolean;
  source: "db" | "env" | "none";
}

export async function getDbTreasuryConfig(): Promise<{ address: string | null; privateKey: string | null }> {
  try {
    const [row] = await db
      .select()
      .from(platformConfig)
      .where(eq(platformConfig.key, "treasury"))
      .limit(1);
    const value = (row?.value as any) || {};
    if (!value.address && !value.encryptedKey) return { address: null, privateKey: null };
    let privateKey: string | null = null;
    if (value.encryptedKey) {
      try {
        privateKey = decryptApiKey(value.encryptedKey);
      } catch {
        privateKey = null;
      }
    }
    return { address: value.address || null, privateKey };
  } catch {
    return { address: null, privateKey: null };
  }
}

export async function treasureWalletAddress(): Promise<string | null> {
  const cfg = await getDbTreasuryConfig();
  if (cfg.address) return cfg.address;
  return process.env.TREASURY_WALLET_ADDRESS || null;
}

export async function getTreasuryKeypair(): Promise<Keypair | null> {
  // Admin-set treasury (dashboard) takes priority over env.
  const cfg = await getDbTreasuryConfig();
  if (cfg.privateKey) {
    try {
      return Keypair.fromSecretKey(bs58.decode(cfg.privateKey));
    } catch {
      return null;
    }
  }
  const pk = process.env.TREASURY_PRIVATE_KEY;
  if (!pk) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(pk));
  } catch {
    return null;
  }
}

export async function treasuryConfigStatus(): Promise<TreasuryConfig> {
  const cfg = await getDbTreasuryConfig();
  if (cfg.address && cfg.privateKey) return { address: cfg.address, hasKey: true, source: "db" };
  if (cfg.address) return { address: cfg.address, hasKey: false, source: "db" };
  const envAddr = process.env.TREASURY_WALLET_ADDRESS || null;
  const envKey = process.env.TREASURY_PRIVATE_KEY || null;
  if (envAddr || envKey) return { address: envAddr, hasKey: !!envKey, source: "env" };
  return { address: null, hasKey: false, source: "none" };
}

export async function saveTreasuryConfig(privateKeyBs58: string): Promise<{ address: string }> {
  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBs58));
  } catch (e: any) {
    throw new Error("Invalid treasury private key — must be base58-encoded secret key.");
  }
  const address = keypair.publicKey.toBase58();
  await db
    .insert(platformConfig)
    .values({ key: "treasury", value: { address, encryptedKey: encryptApiKey(privateKeyBs58), updatedAt: new Date().toISOString() } })
    .onConflictDoUpdate({ target: platformConfig.key, set: { value: { address, encryptedKey: encryptApiKey(privateKeyBs58), updatedAt: new Date().toISOString() } } });
  return { address };
}

export async function clearTreasuryConfig(): Promise<void> {
  try {
    await db.delete(platformConfig).where(eq(platformConfig.key, "treasury"));
  } catch {
    // ignore
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

export async function sendSplReward(
  mint: string,
  toWallet: string,
  uiAmount: number
): Promise<string> {
  const keypair = await getTreasuryKeypair();
  if (!keypair) throw new Error("Treasury key is not set — configure the treasury wallet in Rewards admin settings.");
  const conn = getConnection();
  const decimals = await getTokenDecimals(mint);
  const amountBase = BigInt(Math.round(uiAmount * 10 ** decimals));
  const mintPub = new PublicKey(mint);
  const toPub = new PublicKey(toWallet);

  // Determine if this is a Token-2022 mint
  const isToken2022 = mint === PROJECT_MINT;
  const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : undefined;

  const fromAta = await getAssociatedTokenAddress(mintPub, keypair.publicKey, false, tokenProgramId);
  const toAta = await getAssociatedTokenAddress(mintPub, toPub, false, tokenProgramId);

  const fromInfo = await conn.getAccountInfo(fromAta);

  // Create treasury ATA if it doesn't exist (treasury may have tokens in wallet directly)
  const tx = new Transaction();

  if (!fromInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        keypair.publicKey,
        fromAta,
        keypair.publicKey,
        mintPub,
        isToken2022 ? TOKEN_2022_PROGRAM_ID : undefined,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      )
    );
  }
  // Create recipient ATA if it doesn't exist
  const toInfo = await conn.getAccountInfo(toAta);
  if (!toInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        keypair.publicKey,
        toAta,
        toPub,
        mintPub,
        isToken2022 ? TOKEN_2022_PROGRAM_ID : undefined,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      )
    );
  }

  tx.add(createTransferInstruction(fromAta, toAta, keypair.publicKey, amountBase, undefined, tokenProgramId));
  tx.feePayer = keypair.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
  tx.sign(keypair);
  const sig = await conn.sendRawTransaction(tx.serialize());
  await conn.confirmTransaction(sig, "confirmed");
  return sig;
}

export async function getTreasurySolBalance(address?: string): Promise<number> {
  const addr = address || (await treasureWalletAddress());
  if (!addr) return 0;
  try {
    const lamports = await getBalance(addr);
    return (lamports || 0) / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

import { execSync } from "child_process";

export interface OwsWallet {
  id: string;
  name: string;
  secured: boolean;
  addresses: { chain: string; chainName: string; address: string; path: string }[];
  created: string;
}

export interface OwsPolicy {
  id: string;
  name: string;
  version: number;
  rules: any[];
  enabled: boolean;
}

export interface OwsApiKey {
  id: string;
  name: string;
  wallets: string[];
  policies: string[];
  token?: string;
  created: string;
}

function runOws(args: string, input?: string): string {
  const cmd = `ows ${args}`;
  try {
    const result = input
      ? execSync(`echo '${input.replace(/'/g, "'\\''")}' | ${cmd}`, {
          encoding: "utf-8",
          timeout: 30000,
        })
      : execSync(cmd, { encoding: "utf-8", timeout: 30000 });
    return result.trim();
  } catch (e: any) {
    throw new Error(`OWS command failed: ${e.message}`);
  }
}

export function createWallet(name: string, passphrase: string): string {
  return runOws(`wallet create --name "${name}"`, passphrase);
}

export function listWallets(): string {
  return runOws("wallet list");
}

export function createPolicy(policyFile: string): string {
  return runOws(`policy create --file ${policyFile}`);
}

export function listPolicies(): string {
  return runOws("policy list");
}

export function createApiKey(
  name: string,
  wallet: string,
  policy?: string,
  passphrase?: string
): string {
  const args = `key create --name "${name}" --wallet "${wallet}"${
    policy ? ` --policy "${policy}"` : ""
  }`;
  return runOws(args, passphrase || "");
}

export function listApiKeys(): string {
  return runOws("key list");
}

export function revokeApiKey(keyId: string): string {
  return runOws(`key revoke ${keyId}`);
}

export function signMessage(
  wallet: string,
  chain: string,
  message: string,
  passphrase?: string
): string {
  return runOws(
    `sign message --wallet "${wallet}" --chain ${chain} --message "${message}"`,
    passphrase
  );
}

export function buildAnsemOnlyPolicy(): object {
  const ansemMint =
    process.env.ANSEM_TOKEN_MINT || "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";
  return {
    id: `ansemrail-ansem-only-${Date.now()}`,
    name: "AnsemRail Ansem-Only Mode",
    version: 1,
    description: "Restrict agent to Solana chain with Ansem token preference",
    rules: [
      {
        type: "allowed_chains",
        chain_ids: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
      },
    ],
    enabled: true,
    priority: 1,
    created_at: new Date().toISOString(),
    action: "deny",
    executable: null,
  };
}

export function buildSpendLimitPolicy(maxPerTx: number, maxPerDay: number): object {
  return {
    id: `ansemrail-spend-limit-${Date.now()}`,
    name: `AnsemRail Spend Limit (${maxPerTx}/tx, ${maxPerDay}/day)`,
    version: 1,
    description: `Max ${maxPerTx} USDC per tx, ${maxPerDay} per day`,
    rules: [
      {
        type: "allowed_chains",
        chain_ids: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
      },
    ],
    enabled: true,
    priority: 2,
    created_at: new Date().toISOString(),
    action: "deny",
    executable: null,
  };
}

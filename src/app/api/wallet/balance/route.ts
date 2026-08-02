import { NextRequest, NextResponse } from "next/server";
import {
  getBalance,
  getTokenAccountsByOwner,
  isEvmAddress,
  getEthBalance,
  getEvmTokenBalances,
} from "@/lib/helius";

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 }
      );
    }

    if (isEvmAddress(address)) {
      const [ethBalanceHex, tokens] = await Promise.all([
        getEthBalance(address),
        getEvmTokenBalances(address),
      ]);
      const ethBalanceWei = BigInt(ethBalanceHex);
      return NextResponse.json({
        address,
        chain: "ethereum",
        ethBalance: Number(ethBalanceWei) / 1e18,
        ethBalanceWei: ethBalanceHex,
        solBalance: 0,
        tokens,
      });
    }

    const [solBalance, tokenAccounts] = await Promise.all([
      getBalance(address),
      getTokenAccountsByOwner(address),
    ]);

    const tokens = tokenAccounts.map((account: any) => ({
      mint: account.account?.data?.parsed?.info?.mint,
      amount: account.account?.data?.parsed?.info?.tokenAmount?.uiAmount,
      decimals: account.account?.data?.parsed?.info?.tokenAmount?.decimals,
      owner: account.account?.data?.parsed?.info?.owner,
    }));

    return NextResponse.json({
      address,
      chain: "solana",
      solBalance: solBalance / 1e9,
      solBalanceLamports: solBalance,
      tokens,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch balance", detail: error.message },
      { status: 500 }
    );
  }
}

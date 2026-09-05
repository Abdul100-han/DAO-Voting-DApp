"use client";

import { useAccount, useReadContracts } from "wagmi";
import { formatEther, type Address, zeroAddress } from "viem";
import { GOV_TOKEN_ABI, GOV_TOKEN_ADDRESS } from "@/constants/contracts";

function formatTokenAmount(value?: bigint) {
  if (value === undefined) return "—";
  const amount = Number(formatEther(value));
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function shortenAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDelegate(delegate: Address | undefined, owner?: Address) {
  if (!delegate || delegate === zeroAddress) return "Not Delegated";
  if (owner && delegate.toLowerCase() === owner.toLowerCase()) {
    return "Self Delegated";
  }
  return shortenAddress(delegate);
}

export function UserStats() {
  const { address, isConnected } = useAccount();

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: GOV_TOKEN_ADDRESS,
        abi: GOV_TOKEN_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: GOV_TOKEN_ADDRESS,
        abi: GOV_TOKEN_ABI,
        functionName: "getVotes",
        args: address ? [address] : undefined,
      },
      {
        address: GOV_TOKEN_ADDRESS,
        abi: GOV_TOKEN_ABI,
        functionName: "delegates",
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const balance = data?.[0]?.result;
  const votes = data?.[1]?.result;
  const delegate = data?.[2]?.result;

  if (!isConnected) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
        <h2 className="text-base font-semibold">Wallet not connected</h2>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/80">
          Connect your wallet to view GT balance, voting power, and your current
          delegate.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your governance stats
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Token holdings and voting power for {shortenAddress(address!)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Token Balance"
          value={isLoading ? "…" : `${formatTokenAmount(balance)} GT`}
        />
        <StatCard
          label="Voting Power"
          value={isLoading ? "…" : `${formatTokenAmount(votes)} Votes`}
        />
        <StatCard
          label="Current Delegate"
          value={isLoading ? "…" : formatDelegate(delegate, address)}
        />
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </article>
  );
}

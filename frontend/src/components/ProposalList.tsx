"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient, useReadContracts } from "wagmi";
import type { Address, Hex, PublicClient } from "viem";
import { DAO_VOTING_ABI, DAO_VOTING_ADDRESS } from "@/constants/contracts";

const LOG_FROM_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_PROPOSAL_FROM_BLOCK ?? "11600000",
);
const LOG_CHUNK = 9_999n;

const STATUS_LABELS = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
] as const;

const STATUS_STYLES: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  1: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
  2: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  3: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
  4: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  5: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  6: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  7: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
};

type ProposalLog = {
  proposalId: bigint;
  proposer: Address;
  description: string;
  targets: readonly Address[];
  voteStart: bigint;
  voteEnd: bigint;
};

function shortenAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortenProposalId(id: bigint) {
  const hex = `0x${id.toString(16)}` as Hex;
  return `${hex.slice(0, 8)}...${hex.slice(-6)}`;
}

async function fetchProposalLogs(client: PublicClient): Promise<ProposalLog[]> {
  const latest = await client.getBlockNumber();
  const start = latest < LOG_FROM_BLOCK ? 0n : LOG_FROM_BLOCK;
  const logs: ProposalLog[] = [];

  for (let from = start; from <= latest; from += LOG_CHUNK + 1n) {
    const to = from + LOG_CHUNK > latest ? latest : from + LOG_CHUNK;
    const chunk = await client.getContractEvents({
      address: DAO_VOTING_ADDRESS,
      abi: DAO_VOTING_ABI,
      eventName: "ProposalCreated",
      fromBlock: from,
      toBlock: to,
      strict: true,
    });

    for (const log of chunk) {
      if (
        log.args.proposalId === undefined ||
        log.args.proposer === undefined ||
        log.args.description === undefined ||
        log.args.targets === undefined ||
        log.args.voteStart === undefined ||
        log.args.voteEnd === undefined
      ) {
        continue;
      }

      logs.push({
        proposalId: log.args.proposalId,
        proposer: log.args.proposer,
        description: log.args.description,
        targets: log.args.targets,
        voteStart: log.args.voteStart,
        voteEnd: log.args.voteEnd,
      });
    }
  }

  return logs.reverse();
}

export function ProposalList() {
  const publicClient = usePublicClient();

  const {
    data: proposals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposalCreatedLogs", DAO_VOTING_ADDRESS],
    queryFn: () => {
      if (!publicClient) throw new Error("Public client unavailable");
      return fetchProposalLogs(publicClient);
    },
    enabled: Boolean(publicClient),
  });

  const { data: states } = useReadContracts({
    contracts: proposals.map((proposal) => ({
      address: DAO_VOTING_ADDRESS,
      abi: DAO_VOTING_ABI,
      functionName: "state" as const,
      args: [proposal.proposalId] as const,
    })),
    query: {
      enabled: proposals.length > 0,
    },
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Proposals
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ProposalCreated events from the DAO Voting contract on Sepolia.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-3 h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-4 h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          Failed to load proposals: {error.message}
        </p>
      )}

      {!isLoading && !error && proposals.length === 0 && (
        <p className="rounded-xl border border-zinc-200 bg-white px-5 py-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          No proposals found yet. Create one to see it appear here.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4">
        {proposals.map((proposal, index) => {
          const status = Number(states?.[index]?.result ?? -1);
          const label = STATUS_LABELS[status] ?? "Unknown";
          const badgeClass =
            STATUS_STYLES[status] ??
            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

          return (
            <article
              key={proposal.proposalId.toString()}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-zinc-500">
                    {shortenProposalId(proposal.proposalId)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {proposal.description}
                  </h3>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}
                >
                  {label}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-zinc-500">Proposer</dt>
                  <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                    {shortenAddress(proposal.proposer)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Start block</dt>
                  <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                    {proposal.voteStart.toString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">End block</dt>
                  <dd className="font-mono text-zinc-900 dark:text-zinc-100">
                    {proposal.voteEnd.toString()}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

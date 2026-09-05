"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  DAO_VOTING_ABI,
  DAO_VOTING_ADDRESS,
  GOV_TOKEN_ABI,
  GOV_TOKEN_ADDRESS,
} from "@/constants/contracts";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx";

const SUPPORT = {
  AGAINST: 0,
  FOR: 1,
  ABSTAIN: 2,
} as const;

type CastVoteProps = {
  proposalId: bigint | string;
  proposalState: number;
};

function shortenHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatVotes(value?: bigint) {
  if (value === undefined) return "—";
  return Number(formatEther(value)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CastVote({ proposalId, proposalState }: CastVoteProps) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const id = typeof proposalId === "string" ? BigInt(proposalId) : proposalId;

  const { data: votingWeight } = useReadContract({
    address: GOV_TOKEN_ADDRESS,
    abi: GOV_TOKEN_ABI,
    functionName: "getVotes",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  const busy = isPending || isConfirming;
  const error = writeError ?? confirmError;
  const canVote = Boolean(isConnected && address && !busy && proposalState === 1);

  useEffect(() => {
    if (!isSuccess) return;
    void queryClient.invalidateQueries();
  }, [isSuccess, queryClient]);

  function vote(support: 0 | 1 | 2) {
    if (!canVote) return;
    reset();
    writeContract({
      address: DAO_VOTING_ADDRESS,
      abi: DAO_VOTING_ABI,
      functionName: "castVote",
      args: [id, support],
    });
  }

  if (proposalState < 0) {
    return null;
  }

  if (proposalState !== 1) {
    return (
      <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Voting is closed for this proposal.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Cast your vote
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Weight: {formatVotes(votingWeight)} votes
        </p>
      </div>

      {!isConnected && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Connect your wallet to vote.
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <VoteButton
          label="Vote FOR"
          disabled={!canVote}
          busy={busy}
          onClick={() => vote(SUPPORT.FOR)}
          className="bg-green-600 text-white hover:bg-green-500 disabled:bg-green-600/50"
        />
        <VoteButton
          label="Vote AGAINST"
          disabled={!canVote}
          busy={busy}
          onClick={() => vote(SUPPORT.AGAINST)}
          className="bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/50"
        />
        <VoteButton
          label="Vote ABSTAIN"
          disabled={!canVote}
          busy={busy}
          onClick={() => vote(SUPPORT.ABSTAIN)}
          className="bg-zinc-600 text-white hover:bg-zinc-500 disabled:bg-zinc-600/50 dark:bg-zinc-500 dark:hover:bg-zinc-400"
        />
      </div>

      <div className="space-y-2 text-sm" aria-live="polite">
        {isPending && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
            Please confirm in wallet...
          </p>
        )}
        {isConfirming && hash && (
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
            Mining vote on Sepolia...{" "}
            <a
              href={`${SEPOLIA_EXPLORER}/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline underline-offset-2"
            >
              {shortenHash(hash)}
            </a>
          </p>
        )}
        {isSuccess && !busy && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            Vote confirmed.
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error.shortMessage ?? error.message}
          </p>
        )}
      </div>
    </div>
  );
}

function VoteButton({
  label,
  disabled,
  busy,
  onClick,
  className,
}: {
  label: string;
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed ${className}`}
    >
      {busy && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {label}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAddress, type Address } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { GOV_TOKEN_ABI, GOV_TOKEN_ADDRESS } from "@/constants/contracts";
import { formatTxError } from "@/lib/errors";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx";

function shortenHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function DelegateVotes() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [delegatee, setDelegatee] = useState("");

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
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!isSuccess) return;
    setDelegatee("");
    void queryClient.invalidateQueries();
  }, [isSuccess, queryClient]);

  const busy = isPending || isConfirming;
  const validDelegatee = isAddress(delegatee);
  const canDelegateSelf = Boolean(isConnected && address && !busy);
  const canDelegateAddress = Boolean(isConnected && validDelegatee && !busy);

  function delegateTo(target: Address) {
    reset();
    writeContract({
      address: GOV_TOKEN_ADDRESS,
      abi: GOV_TOKEN_ABI,
      functionName: "delegate",
      args: [target],
    });
  }

  function handleDelegateSelf() {
    if (!address) return;
    delegateTo(address);
  }

  function handleDelegateAddress() {
    if (!validDelegatee) return;
    delegateTo(delegatee);
  }

  const error = writeError ?? confirmError;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Delegate votes
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Assign your voting power to yourself or another address. Tokens stay
          in your wallet.
        </p>
      </div>

      {!isConnected && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Connect your wallet to delegate voting power.
        </p>
      )}

      <label
        htmlFor="delegatee"
        className="block text-sm font-medium text-zinc-600 dark:text-zinc-300"
      >
        Delegatee address
      </label>
      <input
        id="delegatee"
        type="text"
        spellCheck={false}
        autoComplete="off"
        placeholder="0x..."
        value={delegatee}
        disabled={!isConnected || busy}
        onChange={(event) => setDelegatee(event.target.value.trim())}
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-600"
      />
      {delegatee.length > 0 && !validDelegatee && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Enter a valid Ethereum address.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleDelegateSelf}
          disabled={!canDelegateSelf}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Delegate to Self
        </button>
        <button
          type="button"
          onClick={handleDelegateAddress}
          disabled={!canDelegateAddress}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Delegate to Address
        </button>
      </div>

      <div className="mt-4 space-y-2 text-sm" aria-live="polite">
        {isPending && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
            Please confirm in wallet...
          </p>
        )}

        {isConfirming && hash && (
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
            Mining delegation transaction on Sepolia...{" "}
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
            Delegation successful!
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {formatTxError(error)}
          </p>
        )}
      </div>
    </section>
  );
}

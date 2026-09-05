"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAddress, isHex, type Address, type Hex } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  DAO_VOTING_ABI,
  DAO_VOTING_ADDRESS,
  GOV_TOKEN_ADDRESS,
} from "@/constants/contracts";
import { formatTxError } from "@/lib/errors";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx";

const inputClassName =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-600";

function shortenHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

export function CreateProposal() {
  const { isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [target, setTarget] = useState<string>(GOV_TOKEN_ADDRESS);
  const [value, setValue] = useState("0");
  const [calldata, setCalldata] = useState("0x");
  const [description, setDescription] = useState(
    "Proposal #1: Fund Community Treasury",
  );

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

  useEffect(() => {
    if (!isSuccess) return;
    setDescription("");
    setCalldata("0x");
    setValue("0");
    void queryClient.invalidateQueries({ queryKey: ["proposalCreatedLogs"] });
  }, [isSuccess, queryClient]);

  const busy = isPending || isConfirming;
  const parsedCalldata = calldata.trim() === "" ? "0x" : calldata.trim();
  const validTarget = isAddress(target);
  const validCalldata = isHex(parsedCalldata);
  const validValue = /^\d+$/.test(value.trim());
  const validDescription = description.trim().length > 0;
  const canSubmit =
    isConnected &&
    !busy &&
    validTarget &&
    validCalldata &&
    validValue &&
    validDescription;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    reset();
    writeContract({
      address: DAO_VOTING_ADDRESS,
      abi: DAO_VOTING_ABI,
      functionName: "propose",
      args: [
        [target as Address],
        [BigInt(value.trim())],
        [parsedCalldata as Hex],
        description.trim(),
      ],
    });
  }

  const error = writeError ?? confirmError;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create proposal
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Submit a governance action to the DAO Voting contract.
          </p>
        </div>
        <span className="text-sm font-medium text-zinc-500">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-zinc-200 px-5 py-5 dark:border-zinc-800">
          {!isConnected && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
              Connect your wallet to create a proposal.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Target address
              <input
                value={target}
                disabled={busy}
                spellCheck={false}
                onChange={(event) => setTarget(event.target.value.trim())}
                className={`${inputClassName} font-mono`}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Value (wei)
              <input
                value={value}
                disabled={busy}
                inputMode="numeric"
                onChange={(event) => setValue(event.target.value)}
                className={inputClassName}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Calldata
            <input
              value={calldata}
              disabled={busy}
              spellCheck={false}
              placeholder="0x"
              onChange={(event) => setCalldata(event.target.value)}
              className={`${inputClassName} font-mono`}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Description
            <textarea
              value={description}
              disabled={busy}
              rows={3}
              placeholder="Proposal #1: Fund Community Treasury"
              onChange={(event) => setDescription(event.target.value)}
              className={inputClassName}
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white sm:w-auto"
          >
            Submit proposal
          </button>

          <div className="space-y-2 text-sm" aria-live="polite">
            {isPending && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                Signature pending — please confirm in wallet...
              </p>
            )}
            {isConfirming && hash && (
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                Mining on Sepolia...{" "}
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
                Confirmed — proposal created.
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {formatTxError(error)}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

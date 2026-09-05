"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Sepolia
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">
            DAO Governance Portal
          </h1>
        </div>
        <div className="shrink-0">
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </div>
    </header>
  );
}

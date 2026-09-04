import { ConnectWallet } from "@/components/ConnectWallet";
import { DAO_VOTING_ADDRESS, GOV_TOKEN_ADDRESS } from "@/constants/contracts";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="flex items-center justify-between border-b border-black/[.06] px-6 py-4 dark:border-white/[.08]">
        <h1 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          DAO Voting
        </h1>
        <ConnectWallet />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Governance
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Connect a wallet on Sepolia to propose, delegate, and vote.
          </p>
        </div>

        <section className="rounded-xl border border-black/[.08] bg-white p-5 dark:border-white/[.12] dark:bg-zinc-950">
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Deployed contracts
          </h3>
          <dl className="mt-4 space-y-3 font-mono text-sm">
            <div>
              <dt className="text-zinc-500">GovToken</dt>
              <dd className="break-all text-black dark:text-zinc-100">
                {GOV_TOKEN_ADDRESS}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">DAOVoting</dt>
              <dd className="break-all text-black dark:text-zinc-100">
                {DAO_VOTING_ADDRESS}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}

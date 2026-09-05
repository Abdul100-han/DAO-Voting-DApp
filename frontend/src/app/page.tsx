import { Navbar } from "@/components/Navbar";
import { UserStats } from "@/components/UserStats";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <UserStats />
      </main>
    </div>
  );
}

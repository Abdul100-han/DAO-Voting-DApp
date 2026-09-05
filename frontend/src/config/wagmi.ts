import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { fallback, http } from "wagmi";
import { sepolia } from "wagmi/chains";

const PLACEHOLDER = "YOUR_ALCHEMY_KEY";
const PUBLIC_SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

function sepoliaRpcUrl() {
  const configured = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL;
  if (!configured || configured.includes(PLACEHOLDER)) {
    return PUBLIC_SEPOLIA_RPC;
  }
  return configured;
}

export const config = getDefaultConfig({
  appName: "DAO Voting DApp",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
  chains: [sepolia],
  transports: {
    [sepolia.id]: fallback([
      http(sepoliaRpcUrl()),
      http(PUBLIC_SEPOLIA_RPC),
      http("https://rpc.sepolia.org"),
    ]),
  },
  ssr: true,
});

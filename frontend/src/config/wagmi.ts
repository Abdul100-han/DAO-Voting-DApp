import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { fallback, http } from "wagmi";
import { sepolia } from "wagmi/chains";

const PLACEHOLDER = "YOUR_ALCHEMY_KEY";
const PUBLIC_SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
/** RainbowKit throws during `next build` if this is empty. WalletConnect QR still needs a real Reown ID. */
const FALLBACK_WALLETCONNECT_PROJECT_ID = "00000000000000000000000000000000";

function sepoliaRpcUrl() {
  const configured = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL;
  if (!configured || configured.includes(PLACEHOLDER)) {
    return PUBLIC_SEPOLIA_RPC;
  }
  return configured;
}

function walletConnectProjectId() {
  const configured = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID?.trim();
  if (
    !configured ||
    configured.includes("YOUR_WALLETCONNECT") ||
    configured.includes("YOUR_PROJECT")
  ) {
    return FALLBACK_WALLETCONNECT_PROJECT_ID;
  }
  return configured;
}

export const config = getDefaultConfig({
  appName: "DAO Voting DApp",
  projectId: walletConnectProjectId(),
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

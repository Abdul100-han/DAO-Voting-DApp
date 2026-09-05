import type { NextConfig } from "next";
import path from "node:path";

const emptyModule = path.join(process.cwd(), "src/stubs/empty-module.ts");

const x402Aliases = {
  "@x402/core/client": emptyModule,
  "@x402/svm/exact/client": emptyModule,
  "@x402/evm/exact/client": emptyModule,
};

const nextConfig: NextConfig = {
  transpilePackages: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
  serverExternalPackages: ["@coinbase/cdp-sdk", "@base-org/account"],
  turbopack: {
    resolveAlias: x402Aliases,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...x402Aliases,
    };
    return config;
  },
};

export default nextConfig;

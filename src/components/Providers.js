"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig, RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider, http } from "wagmi";

import { TOOL_CHAIN, WALLETCONNECT_PROJECT_ID } from "@/lib/toolContract";

const wagmiConfig = getDefaultConfig({
  appName: "tooL",
  appDescription: "Mint tooL directly from the website.",
  appUrl: "https://tool-site-fe.vercel.app",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [TOOL_CHAIN],
  transports: {
    [TOOL_CHAIN.id]: http(),
  },
  ssr: true,
});

const theme = lightTheme({
  accentColor: "#d62222",
  accentColorForeground: "#fffef6",
  borderRadius: "none",
  fontStack: "system",
  overlayBlur: "small",
  fontWeight: "normal",
});

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

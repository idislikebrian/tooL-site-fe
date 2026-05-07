"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { useState } from "react";
import { WagmiProvider, http } from "wagmi";

import MiniAppBootstrap from "@/components/MiniAppBootstrap";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_URL,
  MINIAPP_ICON_URL,
} from "@/lib/appConfig";
import { TOOL_CHAIN, WALLETCONNECT_PROJECT_ID } from "@/lib/toolContract";

function isOutsideMiniApp() {
  const currentWindow = globalThis.window;

  if (!currentWindow) {
    return true;
  }

  return (
    !currentWindow.ReactNativeWebView && currentWindow === currentWindow.parent
  );
}

function farcasterWallet() {
  return {
    id: "farcaster",
    name: "Farcaster",
    rdns: "xyz.farcaster.MiniAppWallet",
    iconUrl: MINIAPP_ICON_URL,
    iconBackground: "#fffff8",
    hidden: isOutsideMiniApp,
    createConnector: () => farcasterMiniApp(),
  };
}

const wagmiConfig = getDefaultConfig({
  appName: APP_NAME,
  appDescription: APP_DESCRIPTION,
  appUrl: APP_URL,
  appIcon: MINIAPP_ICON_URL,
  projectId: WALLETCONNECT_PROJECT_ID,
  wallets: [
    {
      groupName: "Mini App",
      wallets: [farcasterWallet],
    },
    {
      groupName: "Browser wallets",
      wallets: [
        injectedWallet,
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  chains: [TOOL_CHAIN],
  transports: {
    [TOOL_CHAIN.id]: http(),
  },
  ssr: true,
});

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <MiniAppBootstrap />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

"use client";

import { useEffect } from "react";

function isPotentialMiniAppHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.ReactNativeWebView) || window !== window.parent;
}

function afterStablePaint(callback) {
  let secondFrame;
  const firstFrame = window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(callback);
  });

  return () => {
    window.cancelAnimationFrame(firstFrame);
    if (secondFrame) {
      window.cancelAnimationFrame(secondFrame);
    }
  };
}

export default function MiniAppBootstrap() {
  useEffect(() => {
    let cancelled = false;
    let cancelReady = () => {};

    async function initializeMiniApp() {
      if (!isPotentialMiniAppHost()) {
        return;
      }

      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        if (cancelled) {
          return;
        }

        const isInMiniApp =
          typeof sdk.isInMiniApp === "function"
            ? await sdk.isInMiniApp(1000)
            : true;
        if (cancelled || !isInMiniApp) {
          return;
        }

        if (typeof sdk.back?.enableWebNavigation === "function") {
          sdk.back.enableWebNavigation().catch(() => {});
        }

        cancelReady = afterStablePaint(async () => {
          if (cancelled || typeof sdk.actions?.ready !== "function") {
            return;
          }

          try {
            await sdk.actions.ready();
          } catch {
            // The regular website must keep working even if a host SDK call fails.
          }
        });
      } catch {
        // No-op outside compatible Farcaster clients.
      }
    }

    initializeMiniApp();

    return () => {
      cancelled = true;
      cancelReady();
    };
  }, []);

  return null;
}

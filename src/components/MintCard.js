"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { createPublicClient, fallback, formatEther, http } from "viem";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import styles from "./MintCard.module.css";
import {
  TOOL_ABI,
  TOOL_CHAIN,
  TOOL_CONTRACT_ADDRESS,
  WALLETCONNECT_PROJECT_ID,
  MAINNET_RPC_URLS,
  getContractUrl,
} from "@/lib/toolContract";

const publicClient = createPublicClient({
  chain: TOOL_CHAIN,
  transport: fallback(MAINNET_RPC_URLS.map((url) => http(url))),
});

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(Number(timestamp) * 1000);
}

export default function MintCard() {
  const [mintMode, setMintMode] = useState("next");
  const [tokenId, setTokenId] = useState("1");
  const [localError, setLocalError] = useState("");
  const [pendingHash, setPendingHash] = useState();
  const [confirmedHash, setConfirmedHash] = useState();
  const [sale, setSale] = useState({
    nextTokenId: undefined,
    publicSupply: undefined,
    mintPrice: undefined,
    startTime: undefined,
    freeDuration: undefined,
  });
  const [isSaleLoading, setIsSaleLoading] = useState(Boolean(TOOL_CONTRACT_ADDRESS));
  const [saleReadError, setSaleReadError] = useState("");

  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const {
    writeContractAsync,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } =
    useWaitForTransactionReceipt({
      hash: pendingHash,
      chainId: TOOL_CHAIN.id,
      confirmations: 1,
    });

  useEffect(() => {
    let cancelled = false;

    async function loadSale() {
      if (!TOOL_CONTRACT_ADDRESS) {
        setIsSaleLoading(false);
        return;
      }

      setIsSaleLoading(true);
      setSaleReadError("");

      try {
        const [nextTokenId, publicSupply, mintPrice, startTime, freeDuration] =
          await Promise.all([
            publicClient.readContract({
              address: TOOL_CONTRACT_ADDRESS,
              abi: TOOL_ABI,
              functionName: "nextTokenId",
            }),
            publicClient.readContract({
              address: TOOL_CONTRACT_ADDRESS,
              abi: TOOL_ABI,
              functionName: "PUBLIC_SUPPLY",
            }),
            publicClient.readContract({
              address: TOOL_CONTRACT_ADDRESS,
              abi: TOOL_ABI,
              functionName: "MINT_PRICE",
            }),
            publicClient.readContract({
              address: TOOL_CONTRACT_ADDRESS,
              abi: TOOL_ABI,
              functionName: "START_TIME",
            }),
            publicClient.readContract({
              address: TOOL_CONTRACT_ADDRESS,
              abi: TOOL_ABI,
              functionName: "FREE_DURATION",
            }),
          ]);

        if (!cancelled) {
          setSale({
            nextTokenId,
            publicSupply,
            mintPrice,
            startTime,
            freeDuration,
          });
        }
      } catch {
        if (!cancelled) {
          setSaleReadError("Unable to read sale data from Ethereum.");
        }
      } finally {
        if (!cancelled) {
          setIsSaleLoading(false);
        }
      }
    }

    loadSale();
    const intervalId = window.setInterval(loadSale, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const { nextTokenId, publicSupply, mintPrice, startTime, freeDuration } = sale;
  const freeMintEndsAt =
    startTime !== undefined && freeDuration !== undefined ? startTime + freeDuration : null;
  const freeMintActive = freeMintEndsAt
    ? BigInt(Math.floor(Date.now() / 1000)) <= freeMintEndsAt
    : null;
  let effectiveError = "";

  if (localError) {
    effectiveError = localError;
  } else if (writeError) {
    effectiveError = writeError.shortMessage || writeError.message;
  } else if (receiptError) {
    effectiveError = receiptError.shortMessage || receiptError.message;
  } else if (saleReadError) {
    effectiveError = "Unable to read sale data from Ethereum.";
  }

  useEffect(() => {
    if (!isConfirmed) {
      return;
    }

    setConfirmedHash(pendingHash);
  }, [isConfirmed, pendingHash]);

  async function submitMint() {
    if (!TOOL_CONTRACT_ADDRESS) {
      setLocalError("Set NEXT_PUBLIC_TOOL_CONTRACT_ADDRESS to enable minting.");
      return;
    }

    if (!isConnected) {
      setLocalError("Connect a wallet first.");
      return;
    }

    setLocalError("");
    setConfirmedHash(undefined);
    setPendingHash(undefined);

    try {
      if (chainId !== TOOL_CHAIN.id) {
        await switchChainAsync({ chainId: TOOL_CHAIN.id });
      }

      if (mintMode === "claim") {
        const normalizedTokenId = Number.parseInt(tokenId, 10);

        if (!Number.isInteger(normalizedTokenId) || normalizedTokenId < 1) {
          throw new Error("Enter a valid public token ID.");
        }
      }

      const hash = await writeContractAsync({
        address: TOOL_CONTRACT_ADDRESS,
        abi: TOOL_ABI,
        functionName: mintMode === "claim" ? "claim" : "mintNext",
        args: mintMode === "claim" ? [BigInt(tokenId)] : [],
        value: freeMintActive ? 0n : mintPrice ?? 0n,
        chain: TOOL_CHAIN,
      });

      setPendingHash(hash);
    } catch (mintError) {
      setLocalError(mintError.shortMessage || mintError.message || "Mint failed.");
    }
  }

  const mintButtonLabel =
    mintMode === "claim" ? `Claim #${tokenId || "?"}` : "Mint Next";
  const isMinting = isWriting || isConfirming || isSwitchingChain;
  const etherscanTxUrl = pendingHash
    ? `https://etherscan.io/tx/${pendingHash}`
    : confirmedHash
      ? `https://etherscan.io/tx/${confirmedHash}`
      : "";

  return (
    <section className={styles.card}>
      <div className={styles.stats}>
        <div>
          <span className={styles.label}>Contract</span>
          <a href={getContractUrl()} target="_blank" rel="noreferrer">
            {TOOL_CONTRACT_ADDRESS ? formatAddress(TOOL_CONTRACT_ADDRESS) : "Address not set"}
          </a>
        </div>
        <div>
          <span className={styles.label}>Price</span>
          <span>{mintPrice !== undefined ? `${formatEther(mintPrice)} ETH` : "Loading"}</span>
        </div>
        <div>
          <span className={styles.label}>Next</span>
          <span>{nextTokenId !== undefined ? `#${nextTokenId}` : "Loading"}</span>
        </div>
        <div>
          <span className={styles.label}>Supply</span>
          <span>{publicSupply !== undefined ? `${publicSupply} public` : "Loading"}</span>
        </div>
        <div>
          <span className={styles.label}>Free window</span>
          <span>
            {freeMintActive === null || isSaleLoading
              ? "Loading"
              : freeMintActive
                ? "Live"
                : "Ended"}
          </span>
        </div>
        <div>
          <span className={styles.label}>Free ends</span>
          <span>{freeMintEndsAt ? formatTimestamp(freeMintEndsAt) : "Loading"}</span>
        </div>
      </div>
            <div className={styles.copy}>
        <p className={styles.eyebrow}>Mint on Ethereum Mainnet</p>
        <h2>Mint a tooL box</h2>
        <p className={styles.description}>
          Connect with MetaMask, Rainbow, or WalletConnect, then mint the next tooL or
          claim a specific public token ID.
        </p>
      </div>
      <div className={styles.actions}>
        <div className={styles.connectShell}>
          <ConnectButton
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "address",
            }}
            chainStatus={{
              smallScreen: "icon",
              largeScreen: "name",
            }}
            showBalance={false}
          />
        </div>

        {isConnected ? (
          <p className={styles.walletNote}>Connected wallet: {formatAddress(address)}</p>
        ) : null}

        <div className={styles.modeRow}>
          <button
            type="button"
            className={mintMode === "next" ? styles.modeActive : styles.modeButton}
            onClick={() => setMintMode("next")}
          >
            Mint next
          </button>
          <button
            type="button"
            className={mintMode === "claim" ? styles.modeActive : styles.modeButton}
            onClick={() => setMintMode("claim")}
          >
            Claim ID
          </button>
          <label
            className={`${styles.claimField} ${
              mintMode === "claim" ? "" : styles.claimFieldHidden
            }`}
          >
            <span>Public token ID</span>
            <input
              type="number"
              min="1"
              max={publicSupply ? publicSupply.toString() : "777"}
              value={tokenId}
              onChange={(event) => setTokenId(event.target.value)}
              disabled={mintMode !== "claim"}
              aria-hidden={mintMode !== "claim"}
            />
          </label>
        </div>

        <button
          type="button"
          className={styles.mintButton}
          onClick={submitMint}
          disabled={isMinting || !TOOL_CONTRACT_ADDRESS || !isConnected}
        >
          {isSwitchingChain
            ? "Switching network..."
            : isConfirming
              ? "Confirming..."
              : isWriting
                ? "Submitting..."
                : mintButtonLabel}
        </button>

        {pendingHash ? (
          <div className={styles.feedbackCard}>
            <p className={styles.status}>
              {isConfirming
                ? "Transaction submitted. Waiting for confirmation..."
                : confirmedHash
                  ? "Mint confirmed on Ethereum."
                  : "Transaction submitted."}
            </p>
            <a
              href={etherscanTxUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.txLink}
            >
              View transaction on Etherscan
            </a>
          </div>
        ) : null}
        {effectiveError ? <p className={styles.error}>{effectiveError}</p> : null}
        {WALLETCONNECT_PROJECT_ID === "00000000000000000000000000000000" ? (
          <p className={styles.note}>
            Add <code>NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code> to enable Rainbow and
            WalletConnect.
          </p>
        ) : null}
      </div>

    </section>
  );
}

"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import {
  createPublicClient,
  decodeEventLog,
  fallback,
  formatEther,
  http,
  zeroAddress,
} from "viem";
import {
  useAccount,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import styles from "./MintCard.module.css";
import { APP_URL } from "@/lib/appConfig";
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

const PREPARING_MIN_MS = 2000;
const REVEAL_BEAT_MS = 500;
const PUBLIC_TOKEN_LIMIT = 777;
const TRANSFER_EVENT_ABI = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
  },
];

async function readSaleSnapshot() {
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

  return {
    nextTokenId,
    publicSupply,
    mintPrice,
    startTime,
    freeDuration,
  };
}

async function readMintedPublicIds() {
  const logs = await publicClient.getLogs({
    address: TOOL_CONTRACT_ADDRESS,
    event: TRANSFER_EVENT_ABI[0],
    args: {
      from: zeroAddress,
    },
    fromBlock: 0n,
  });

  return logs
    .map((log) => Number(log.args.tokenId))
    .filter((tokenId) => tokenId > 0 && tokenId <= PUBLIC_TOKEN_LIMIT);
}

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(Number(timestamp) * 1000);
}

function decodeBase64(value) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.atob(value);
}

function parseDataUriJson(dataUri) {
  const base64Prefix = "data:application/json;base64,";
  const utf8Prefix = "data:application/json;utf8,";

  if (!dataUri) {
    return null;
  }

  try {
    if (dataUri.startsWith(base64Prefix)) {
      return JSON.parse(decodeBase64(dataUri.slice(base64Prefix.length)));
    }

    if (dataUri.startsWith(utf8Prefix)) {
      return JSON.parse(decodeURIComponent(dataUri.slice(utf8Prefix.length)));
    }

    return null;
  } catch {
    return null;
  }
}

function truncateText(value, maxLength) {
  if (!value || value.length <= maxLength) {
    return value || "";
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function getMetadataAttribute(metadata, names) {
  const attributes = Array.isArray(metadata?.attributes)
    ? metadata.attributes
    : [];
  const normalizedNames = names.map((name) => name.toLowerCase());

  return attributes.find((attribute) => {
    const traitType = String(attribute?.trait_type || "").toLowerCase();
    return normalizedNames.some((name) => traitType.includes(name));
  })?.value;
}

function getMetadataLoadout(metadata) {
  const attributes = Array.isArray(metadata?.attributes)
    ? metadata.attributes
    : [];
  const excludedTraits = ["context", "title", "bonus", "marker"];

  return attributes
    .filter((attribute) => {
      const traitType = String(attribute?.trait_type || "").toLowerCase();
      return !excludedTraits.some((excluded) => traitType.includes(excluded));
    })
    .map((attribute) => attribute?.value)
    .filter(Boolean)
    .map(String)
    .slice(0, 6);
}

function buildCollectorCast({ tokenId, metadata }) {
  const paddedTokenId = String(tokenId).padStart(3, "0");
  const name = metadata?.name || `tooLbox #${paddedTokenId}`;
  const context =
    getMetadataAttribute(metadata, ["context"]) ||
    metadata?.description ||
    "onchain tools, waiting to be used";
  const loadout = getMetadataLoadout(metadata).join(" / ");
  const lines = [
    `I assembled tooLbox #${paddedTokenId}: ${truncateText(name, 64)}`,
    `Context: ${truncateText(String(context), 72)}`,
  ];

  if (loadout) {
    lines.push(`Loadout: ${truncateText(loadout, 96)}`);
  }

  lines.push(APP_URL);

  return lines.join("\n");
}

async function readTokenMetadata(tokenId) {
  if (!TOOL_CONTRACT_ADDRESS || !tokenId) {
    return null;
  }

  const tokenUri = await publicClient.readContract({
    address: TOOL_CONTRACT_ADDRESS,
    abi: TOOL_ABI,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
  });

  return parseDataUriJson(tokenUri);
}

export default function MintCard() {
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
  const [isSaleLoading, setIsSaleLoading] = useState(
    Boolean(TOOL_CONTRACT_ADDRESS),
  );
  const [saleReadError, setSaleReadError] = useState("");
  const [mintedPublicIds, setMintedPublicIds] = useState([]);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(
    Boolean(TOOL_CONTRACT_ADDRESS),
  );
  const [collectionSession, setCollectionSession] = useState({
    mode: null,
    intendedTokenId: null,
    collectedTokenId: null,
    txHash: null,
    phase: "idle",
    startedAt: null,
    tokenIdSource: null,
  });

  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const {
    writeContractAsync,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();
  const [receipt, setReceipt] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [receiptError, setReceiptError] = useState(null);
  const [mintedTokenMetadata, setMintedTokenMetadata] = useState(null);
  const [mintedTokenMetadataStatus, setMintedTokenMetadataStatus] =
    useState("idle");
  const [canComposeCast, setCanComposeCast] = useState(false);
  const [isComposingCast, setIsComposingCast] = useState(false);
  const [castError, setCastError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSale() {
      if (!TOOL_CONTRACT_ADDRESS) {
        setIsSaleLoading(false);
        setIsAvailabilityLoading(false);
        return;
      }

      setIsSaleLoading(true);
      setIsAvailabilityLoading(true);
      setSaleReadError("");

      try {
        const [snapshot, mintedIds] = await Promise.all([
          readSaleSnapshot(),
          readMintedPublicIds(),
        ]);
        if (!cancelled) {
          setSale(snapshot);
          setMintedPublicIds(mintedIds);
        }
      } catch {
        if (!cancelled) {
          setSaleReadError("Unable to read sale data from Ethereum.");
        }
      } finally {
        if (!cancelled) {
          setIsSaleLoading(false);
          setIsAvailabilityLoading(false);
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

  useEffect(() => {
    let cancelled = false;

    async function detectComposeCast() {
      if (typeof window === "undefined") {
        return;
      }

      if (!window.ReactNativeWebView && window === window.parent) {
        return;
      }

      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        const isInMiniApp =
          typeof sdk.isInMiniApp === "function"
            ? await sdk.isInMiniApp(1000)
            : true;

        if (!cancelled) {
          setCanComposeCast(
            Boolean(isInMiniApp && typeof sdk.actions?.composeCast === "function"),
          );
        }
      } catch {
        if (!cancelled) {
          setCanComposeCast(false);
        }
      }
    }

    detectComposeCast();

    return () => {
      cancelled = true;
    };
  }, []);

  const { nextTokenId, publicSupply, mintPrice, startTime, freeDuration } =
    sale;
  const freeMintEndsAt =
    startTime !== undefined && freeDuration !== undefined
      ? startTime + freeDuration
      : null;
  const freeMintActive = freeMintEndsAt
    ? BigInt(Math.floor(Date.now() / 1000)) <= freeMintEndsAt
    : null;
  const displayedCollectedTokenId = collectionSession.collectedTokenId;
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
    if (!pendingHash || collectionSession.phase !== "preparing") {
      return;
    }

    let cancelled = false;

    async function watchReceipt() {
      setIsConfirming(true);
      setReceiptError(null);

      try {
        const confirmedReceipt = await publicClient.waitForTransactionReceipt({
          hash: pendingHash,
          confirmations: 1,
          pollingInterval: 1_500,
          retryCount: 120,
        });

        if (cancelled) {
          return;
        }

        setReceipt(confirmedReceipt);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setReceiptError(error);
        setCollectionSession((current) =>
          current.phase === "preparing"
            ? {
                ...current,
                phase: "idle",
              }
            : current,
        );
      } finally {
        if (!cancelled) {
          setIsConfirming(false);
        }
      }
    }

    watchReceipt();

    return () => {
      cancelled = true;
    };
  }, [collectionSession.phase, pendingHash]);

  useEffect(() => {
    if (
      !receipt ||
      collectionSession.phase !== "preparing" ||
      !collectionSession.txHash
    ) {
      return;
    }

    let cancelled = false;

    async function finalizeCollection() {
      let collectedTokenId = collectionSession.intendedTokenId;
      let tokenIdSource = collectionSession.mode === "claim" ? "confirmed" : "inferred";

      if (collectionSession.mode === "next") {
        for (const log of receipt.logs) {
          if (
            log.address.toLowerCase() !== TOOL_CONTRACT_ADDRESS.toLowerCase()
          ) {
            continue;
          }

          try {
            const decoded = decodeEventLog({
              abi: TRANSFER_EVENT_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (
              decoded.eventName === "Transfer" &&
              decoded.args.from?.toLowerCase() === zeroAddress &&
              decoded.args.to?.toLowerCase() === address?.toLowerCase()
            ) {
              collectedTokenId = Number(decoded.args.tokenId);
              tokenIdSource = "confirmed";
              break;
            }
          } catch {
            // Ignore non-Transfer logs.
          }
        }
      }

      const resolvedTokenId = collectedTokenId ?? collectionSession.intendedTokenId ?? 0;

      try {
        const [snapshot, mintedIds] = await Promise.all([
          readSaleSnapshot(),
          readMintedPublicIds(),
        ]);
        if (!cancelled) {
          setSale(snapshot);
          setMintedPublicIds(mintedIds);
        }
      } catch {
        // Keep the existing sale snapshot if refresh fails.
      }

      const elapsed = Date.now() - collectionSession.startedAt;
      const waitTime = Math.max(0, PREPARING_MIN_MS - elapsed) + REVEAL_BEAT_MS;

      window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        setConfirmedHash(collectionSession.txHash);
        setCollectionSession((current) => ({
          ...current,
          collectedTokenId: resolvedTokenId,
          tokenIdSource,
          phase: "revealing",
        }));
      }, waitTime);
    }

    finalizeCollection();

    return () => {
      cancelled = true;
    };
  }, [address, collectionSession, receipt]);

  useEffect(() => {
    if (!displayedCollectedTokenId) {
      setMintedTokenMetadata(null);
      setMintedTokenMetadataStatus("idle");
      return;
    }

    let cancelled = false;

    async function loadTokenMetadata() {
      setMintedTokenMetadataStatus("loading");

      try {
        const metadata = await readTokenMetadata(displayedCollectedTokenId);

        if (!cancelled) {
          setMintedTokenMetadata(metadata);
          setMintedTokenMetadataStatus(metadata?.image ? "ready" : "empty");
        }
      } catch (error) {
        if (!cancelled) {
          setMintedTokenMetadata(null);
          setMintedTokenMetadataStatus(
            error?.shortMessage || error?.message ? "error" : "empty",
          );
        }
      }
    }

    loadTokenMetadata();

    return () => {
      cancelled = true;
    };
  }, [displayedCollectedTokenId]);

  async function submitMint(requestedMode) {
    if (!TOOL_CONTRACT_ADDRESS) {
      setLocalError(
        "Set NEXT_PUBLIC_TOOL_CONTRACT_ADDRESS to enable collecting.",
      );
      return;
    }

    if (!isConnected) {
      setLocalError("Connect a wallet first.");
      return;
    }

    if (requestedMode === "claim") {
      const normalizedTokenId = Number.parseInt(tokenId, 10);

      if (!Number.isInteger(normalizedTokenId) || normalizedTokenId < 1) {
        setLocalError("Enter a valid public token ID.");
        return;
      }

      if (publicSupply && normalizedTokenId > Number(publicSupply)) {
        setLocalError(`Enter a public token ID from 1 to ${publicSupply}.`);
        return;
      }
    }

    setLocalError("");
    setCastError("");
    setConfirmedHash(undefined);
    setPendingHash(undefined);
    setReceipt(null);
    setReceiptError(null);
    setCollectionSession({
      mode: requestedMode,
      intendedTokenId:
        requestedMode === "claim"
          ? Number.parseInt(tokenId, 10)
          : nextTokenId
            ? Number(nextTokenId)
            : null,
      collectedTokenId: null,
      txHash: null,
      phase: "preparing",
      startedAt: Date.now(),
      tokenIdSource: null,
    });

    try {
      if (chainId !== TOOL_CHAIN.id) {
        await switchChainAsync({ chainId: TOOL_CHAIN.id });
      }

      const hash = await writeContractAsync({
        address: TOOL_CONTRACT_ADDRESS,
        abi: TOOL_ABI,
        functionName: requestedMode === "claim" ? "claim" : "mintNext",
        args: requestedMode === "claim" ? [BigInt(tokenId)] : [],
        value: freeMintActive ? 0n : (mintPrice ?? 0n),
        chain: TOOL_CHAIN,
      });

      setPendingHash(hash);
      setCollectionSession((current) => ({
        ...current,
        txHash: hash,
      }));
    } catch (mintError) {
      setCollectionSession({
        mode: null,
        intendedTokenId: null,
        collectedTokenId: null,
        txHash: null,
        phase: "idle",
        startedAt: null,
        tokenIdSource: null,
      });
      setLocalError(
        mintError.shortMessage || mintError.message || "Collection failed.",
      );
    }
  }

  const isMinting = isWriting || isConfirming || isSwitchingChain;
  const showSuccessModal =
    collectionSession.phase === "revealing" ||
    collectionSession.phase === "joining";
  const etherscanTxUrl = pendingHash
    ? `https://etherscan.io/tx/${pendingHash}`
    : confirmedHash
      ? `https://etherscan.io/tx/${confirmedHash}`
      : "";
  const collectedPosition =
    collectionSession.collectedTokenId && publicSupply
      ? (collectionSession.collectedTokenId / Number(publicSupply)) * 100
      : 0;
  const revealHeading =
    collectionSession.mode === "claim"
      ? `toolbox ${String(collectionSession.collectedTokenId).padStart(3, "0")} assembled.`
      : `toolbox ${String(collectionSession.collectedTokenId).padStart(3, "0")} assembled.`;
  const revealCopy =
    collectionSession.mode === "claim"
      ? "you asked for this one by number. the system doesn't care why. but it noticed."
      : "you took what was next. that's how most of this works.";
  const preparingCopy =
    collectionSession.mode === "claim" && collectionSession.intendedTokenId
      ? `locating slot ${String(collectionSession.intendedTokenId).padStart(3, "0")}...`
      : "assigning next available slot...";
  const mintedPublicIdSet = new Set(mintedPublicIds);
  const availablePublicIds = [];
  for (let id = 1; id <= PUBLIC_TOKEN_LIMIT; id += 1) {
    if (!mintedPublicIdSet.has(id)) {
      availablePublicIds.push(id);
    }
  }
  const claimedPublicCount = mintedPublicIds.length;

  function handleSlipAnimationEnd() {
    setCollectionSession((current) =>
      current.phase === "revealing"
        ? {
            ...current,
            phase: "joining",
          }
        : current,
    );
  }

  function chooseRandomOpenId() {
    if (!availablePublicIds.length) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * availablePublicIds.length);
    setTokenId(String(availablePublicIds[randomIndex]));
  }

  async function shareCollectedToolbox() {
    if (!displayedCollectedTokenId) {
      return;
    }

    setIsComposingCast(true);
    setCastError("");

    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      await sdk.actions.composeCast({
        text: buildCollectorCast({
          tokenId: displayedCollectedTokenId,
          metadata: mintedTokenMetadata,
        }),
        embeds: [APP_URL],
      });
    } catch (error) {
      setCastError(error?.message || "Unable to open the Farcaster composer.");
    } finally {
      setIsComposingCast(false);
    }
  }

  const activeMintMode =
    collectionSession.phase === "preparing" ? collectionSession.mode : null;
  const collectButtonLabel =
    isSwitchingChain && activeMintMode === "next"
      ? "Switching network..."
      : activeMintMode === "next" &&
          (collectionSession.phase === "preparing" || isConfirming)
        ? "Confirming..."
        : isWriting && activeMintMode === "next"
          ? "Submitting..."
          : "Collect next available";
  const claimButtonLabel =
    isSwitchingChain && activeMintMode === "claim"
      ? "Switching network..."
      : activeMintMode === "claim" &&
          (collectionSession.phase === "preparing" || isConfirming)
        ? "Confirming..."
        : isWriting && activeMintMode === "claim"
          ? "Submitting..."
          : `Claim toolbox #${tokenId || "?"}`;

  return (
    <section className={styles.card}>
      <div className={styles.stats}>
        <div>
          <span className={styles.label}>Contract</span>
          <a href={getContractUrl()} target="_blank" rel="noreferrer">
            {TOOL_CONTRACT_ADDRESS
              ? formatAddress(TOOL_CONTRACT_ADDRESS)
              : "Address not set"}
          </a>
        </div>
        <div>
          <span className={styles.label}>Price</span>
          <span>
            {mintPrice !== undefined
              ? `${formatEther(mintPrice)} ETH`
              : "Loading"}
          </span>
        </div>
        <div>
          <span className={styles.label}>Next</span>
          <span>
            {nextTokenId !== undefined ? `#${nextTokenId}` : "Loading"}
          </span>
        </div>
        <div>
          <span className={styles.label}>Supply</span>
          <span>
            {publicSupply !== undefined ? `${publicSupply} public` : "Loading"}
          </span>
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
          <span>
            {freeMintEndsAt ? formatTimestamp(freeMintEndsAt) : "Loading"}
          </span>
        </div>
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>On Ethereum Mainnet</p>
        <h2>Collect a tooL box</h2>
        <p className={styles.description}>
          Connect wallet, then collect the
          next available tooL or claim a specific ID.
        </p>
      </div>
      <div className={styles.actions}>
        <div className={styles.connectShell}>
          <ConnectButton.Custom>
            {({
              openConnectModal,
              openAccountModal,
              openChainModal,
              account,
              chain,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              let label = "Connect Wallet";
              let action = openConnectModal;

              if (connected && chain.unsupported) {
                label = "Wrong Network";
                action = openChainModal;
              } else if (connected) {
                label = account.displayName;
                action = openAccountModal;
              }

              return (
                <button
                  type="button"
                  onClick={action}
                  className={styles.walletButton}
                  aria-hidden={!ready}
                >
                  {label}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>

        {isConnected ? (
          <p className={styles.walletNote}>
            Connected wallet: {formatAddress(address)}
          </p>
        ) : null}

        <button
          type="button"
          className={styles.collectButton}
          onClick={() => submitMint("next")}
          disabled={isMinting || !TOOL_CONTRACT_ADDRESS || !isConnected}
        >
          {collectButtonLabel}
        </button>

        <div className={styles.claimPanel}>
          <div className={styles.claimHeader}>
            <span className={styles.claimTitle}>Prefer a number?</span>
            <span className={styles.claimHint}>Choose a public ID instead.</span>
          </div>

          <div className={styles.claimControls}>
            <label className={styles.claimField}>
              <span>Public token ID</span>
              <input
                type="number"
                min="1"
                max={publicSupply ? publicSupply.toString() : "777"}
                value={tokenId}
                onChange={(event) => setTokenId(event.target.value)}
              />
            </label>

            <button
              type="button"
              className={styles.claimButton}
              onClick={() => submitMint("claim")}
              disabled={isMinting || !TOOL_CONTRACT_ADDRESS || !isConnected}
            >
              {claimButtonLabel}
            </button>
          </div>

          <div className={styles.randomRow}>
            <button
              type="button"
              className={styles.randomButton}
              onClick={chooseRandomOpenId}
              disabled={isAvailabilityLoading || !availablePublicIds.length}
              aria-label="Pick random available ID"
            >
              {isAvailabilityLoading ? "Checking..." : "Pick random available ID"}
            </button>
            <p className={styles.randomMeta}>
              {availablePublicIds.length
                ? `${availablePublicIds.length} public IDs still open`
                : "All public IDs have been collected"}
            </p>
          </div>
        </div>

        {collectionSession.phase === "preparing" ? (
          <div className={styles.feedbackCard}>
            <p className={styles.status}>{preparingCopy}</p>
            <div className={styles.loaderRail} aria-hidden="true">
              <span className={styles.loaderSegment} />
              <span className={styles.loaderSegment} />
              <span className={styles.loaderSegment} />
              <span className={styles.loaderSegment} />
            </div>
            <p className={styles.loaderCopy}>
              {pendingHash
                ? "Slot indexed. Waiting for Ethereum confirmation."
                : "Open your wallet to authorize the collection."}
            </p>
          </div>
        ) : null}
        {showSuccessModal ? (
          <div
            className={`${styles.assemblySlip} ${
              collectionSession.phase === "revealing" ? styles.revealing : ""
            }`}
            onAnimationEnd={handleSlipAnimationEnd}
          >
            <div className={styles.slipStamp} aria-hidden="true" />
            <p className={styles.slipKicker}>ASSEMBLY SLIP</p>
            <h3 className={styles.slipTitle}>{revealHeading}</h3>
            <p className={styles.slipBody}>{revealCopy}</p>
            {mintedTokenMetadataStatus === "loading" ? (
              <div className={styles.tokenPreviewStatus}>
                Loading onchain artwork for #{displayedCollectedTokenId}...
              </div>
            ) : null}
            {mintedTokenMetadataStatus === "error" ? (
              <div className={styles.tokenPreviewStatus}>
                Unable to load onchain artwork for #{displayedCollectedTokenId}.
              </div>
            ) : null}
            {mintedTokenMetadata?.image ? (
              <div className={styles.tokenPreview}>
                <img
                  src={mintedTokenMetadata.image}
                  alt={
                    mintedTokenMetadata.name ||
                    `tooLbox #${displayedCollectedTokenId}`
                  }
                  className={styles.tokenPreviewImage}
                />
                
              </div>
            ) : null}
            <div className={styles.slipGrid}>
              <div>
                <span className={styles.slipLabel}>Collector</span>
                <span className={styles.slipValue}>{formatAddress(address)}</span>
              </div>
              <div>
                <span className={styles.slipLabel}>Method</span>
                <span className={styles.slipValue}>
                  {collectionSession.mode === "claim" ? "Claim specific" : "Collect next"}
                </span>
              </div>
              <div>
                <span className={styles.slipLabel}>Box</span>
                <span className={styles.slipValue}>#{collectionSession.collectedTokenId}</span>
              </div>
              <div>
                <span className={styles.slipLabel}>Sequence</span>
                <span className={styles.slipValue}>
                  {collectionSession.tokenIdSource === "confirmed"
                    ? "Receipt confirmed"
                    : "Receipt inferred"}
                </span>
              </div>
            </div>
            <div className={styles.progressBlock}>
              <div className={styles.progressMeta}>
                <span className={styles.slipLabel}>Public range placement</span>
                <span className={styles.progressValue}>
                  {String(collectionSession.collectedTokenId).padStart(3, "0")} / {publicSupply || "777"}
                </span>
              </div>
              <div className={styles.progressRail} aria-hidden="true">
                <span
                  className={styles.progressMarker}
                  style={{ left: `${Math.min(100, Math.max(2, collectedPosition))}%` }}
                />
              </div>
            </div>
            <div className={styles.joiningRow}>
              <p className={styles.joiningCopy}>
                {nextTokenId !== undefined
                  ? `${claimedPublicCount} public boxes collected. Next open sequence points at #${nextTokenId}.`
                  : "Sale data refreshing..."}
              </p>
              {etherscanTxUrl ? (
                <a
                  href={etherscanTxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.txLink}
                >
                  View transaction on Etherscan
                </a>
              ) : null}
            </div>
            {canComposeCast ? (
              <div className={styles.sharePanel}>
                <button
                  type="button"
                  className={styles.castButton}
                  onClick={shareCollectedToolbox}
                  disabled={isComposingCast || !displayedCollectedTokenId}
                >
                  {isComposingCast ? "Opening composer..." : "Cast this toolbox"}
                </button>
                {castError ? (
                  <p className={styles.castError}>{castError}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {effectiveError ? (
          <p className={styles.error}>{effectiveError}</p>
        ) : null}
        {WALLETCONNECT_PROJECT_ID === "00000000000000000000000000000000" ? (
          <p className={styles.note}>
            Add <code>NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code> to enable
            Rainbow and WalletConnect.
          </p>
        ) : null}
      </div>
    </section>
  );
}

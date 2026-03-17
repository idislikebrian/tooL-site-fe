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

  async function submitMint() {
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

    setLocalError("");
    setConfirmedHash(undefined);
    setPendingHash(undefined);
    setReceipt(null);
    setReceiptError(null);
    setCollectionSession({
      mode: mintMode,
      intendedTokenId:
        mintMode === "claim"
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

  const mintButtonLabel =
    mintMode === "claim" ? `Claim #${tokenId || "?"}` : "Collect Next";
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
    setMintMode("claim");
    setTokenId(String(availablePublicIds[randomIndex]));
  }

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

        <div className={styles.modeRow}>
          <button
            type="button"
            className={
              mintMode === "next" ? styles.modeActive : styles.modeButton
            }
            onClick={() => setMintMode("next")}
          >
            Collect next
          </button>
          <button
            type="button"
            className={
              mintMode === "claim" ? styles.modeActive : styles.modeButton
            }
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

        <div className={styles.randomRow}>
          <button
            type="button"
            className={styles.randomButton}
            onClick={chooseRandomOpenId}
            disabled={isAvailabilityLoading || !availablePublicIds.length}
            aria-label="Random tooLbox"
            data-tooltip="Random tooLbox"
          >
            {isAvailabilityLoading ? (
              "..."
            ) : (
              <svg
                className={styles.randomIcon}
                viewBox="0 0 14 14"
                role="img"
                focusable="false"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="gray"
                  d="M5.459789 4.64957q-.40178.61607-.91741 1.82813-.14732-.30134-.24777-.4855-.10044-.18415-.2712-.42522-.17076-.24107-.34152-.37835-.17076-.13727-.42188-.23437-.25111-.0971-.54575-.0971H1.214255q-.09375 0-.154018-.0603-.060268-.0602-.060268-.15399V3.35716q0-.0937.06027-.15402.06027-.0603.154018-.0603h1.500004q1.6741 0 2.74553 1.5067zm7.54018 5.35045q0 .0937-.0603.15402l-2.14285 2.14285q-.0603.0603-.15402.0603-.0871 0-.15067-.0636-.0636-.0636-.0636-.15067v-1.28571q-.21428 0-.5692.003-.35491.003-.54241.007-.1875.003-.48884-.007-.30133-.0101-.47544-.0335-.17411-.0234-.42857-.0703-.25447-.0469-.42188-.12388-.16741-.077-.38839-.19085-.22098-.11384-.39509-.26786-.17411-.15401-.3683-.35825-.1942-.20425-.375-.46541.39509-.62276.91071-1.82812.14732.30134.24777.48549.10044.18415.2712.42522.17076.24107.34152.37835t.42188.23438q.25111.0971.54576.0971h1.71428V7.85687q0-.0937.0603-.15402.0603-.0603.15402-.0603.0803 0 .16071.067l2.13616 2.13616q.0603.0603.0603.15402z"
                />
                <path
                  fill="currentColor"
                  d="M12.999969 4.00002q0 .0937-.0603.15401l-2.14285 2.14286q-.0603.0603-.15402.0603-.0871 0-.15067-.0636-.0636-.0636-.0636-.15067V4.85721h-1.71428q-.32143 0-.58259.10045-.26116.10044-.46206.30134-.20089.20089-.34152.41183-.14062.21093-.30133.51897-.21429.41518-.52233 1.14509-.19419.44196-.33147.7433-.13728.30134-.36161.70313-.22433.40178-.42857.66964t-.49553.5558q-.2913.28795-.60268.45871-.31139.17076-.71317.28125-.40179.11049-.85714.11049H1.214245q-.09375 0-.154018-.0603-.060258-.0603-.060258-.15404V9.35716q0-.0937.06027-.15402.06027-.0603.154018-.0603h1.500004q.32142 0 .58258-.10044.26117-.10045.46206-.30134t.34152-.41183q.14062-.21094.30134-.51898.21428-.41517.52232-1.14508.19419-.44197.33147-.74331.13728-.30134.36161-.70312.22433-.40179.42857-.66965.20424-.26785.49553-.5558.2913-.28795.60268-.45871.31139-.17075.71317-.28124.40179-.1105.85715-.1105h1.71428V1.85713q0-.0937.0603-.15402.0603-.0603.15402-.0603.0803 0 .16071.067l2.13616 2.13616q.0603.0603.0603.15402z"
                />
              </svg>
            )}
          </button>
          <p className={styles.randomMeta}>
            {availablePublicIds.length
              ? `${availablePublicIds.length} public IDs still open`
              : "All public IDs have been collected"}
          </p>
        </div>

        <button
          type="button"
          className={styles.mintButton}
          onClick={submitMint}
          disabled={isMinting || !TOOL_CONTRACT_ADDRESS || !isConnected}
        >
          {isSwitchingChain
            ? "Switching network..."
            : collectionSession.phase === "preparing" || isConfirming
              ? "Confirming..."
            : isWriting
                ? "Submitting..."
                : mintButtonLabel}
        </button>

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

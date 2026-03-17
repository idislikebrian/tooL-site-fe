"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import styles from "./OwnedToolboxes.module.css";

function formatTokenId(tokenId) {
  return `#${String(tokenId).padStart(3, "0")}`;
}

export default function OwnedToolboxes() {
  const { address, isConnected } = useAccount();
  const [toolboxes, setToolboxes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isConnected || !address) {
      setToolboxes([]);
      setLoadError("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadToolboxes() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/toolboxes?owner=${address}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load toolboxes.");
        }

        setToolboxes(data.toolboxes || []);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        setToolboxes([]);
        setLoadError(error.message || "Unable to load toolboxes.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadToolboxes();

    return () => {
      controller.abort();
    };
  }, [address, isConnected]);

  if (!isConnected || !address) {
    return null;
  }

  if (!isLoading && !loadError && toolboxes.length === 0) {
    return null;
  }

  return (
    <section className={styles.wrap}>
      <details className={styles.accordion}>
        <summary className={styles.summary}>
          <span>Your toolboxes</span>
          <span className={styles.count}>
            {isLoading ? "Loading..." : `${toolboxes.length} held`}
          </span>
        </summary>

        <div className={styles.panel}>
          {loadError ? <p className={styles.message}>{loadError}</p> : null}

          {!loadError && isLoading ? (
            <p className={styles.message}>Checking connected wallet holdings...</p>
          ) : null}

          {!loadError && !isLoading ? (
            <div className={styles.grid}>
              {toolboxes.map((toolbox) => (
                <article key={toolbox.tokenId} className={styles.card}>
                  {toolbox.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toolbox.image}
                      alt={toolbox.name}
                      className={styles.image}
                    />
                  ) : null}
                  <div className={styles.meta}>
                    <p className={styles.name}>{toolbox.name}</p>
                    <p className={styles.tokenId}>
                      Toolbox {formatTokenId(toolbox.tokenId)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}

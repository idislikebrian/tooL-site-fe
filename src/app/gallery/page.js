import styles from "./page.module.css";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { getContractToolboxes } from "@/lib/alchemy";

export const metadata = {
  title: "Gallery | tooL",
  description: "A gallery of minted tooL boxes on Ethereum mainnet.",
};

export default async function GalleryPage() {
  let toolboxes = [];
  let loadError = "";

  try {
    toolboxes = await getContractToolboxes();
  } catch (error) {
    loadError = error.message || "Unable to load gallery.";
  }

  return (
    <div className={styles.page}>
      <Navigation />
      <main className={styles.container}>
        <p className={styles.kicker}>GALLERY</p>
        <h1 className={styles.title}>Already assembled.</h1>
        <p className={styles.copy}>Minted tooL boxes.</p>

        {!loadError ? (
          <p className={styles.note}>{toolboxes.length} minted</p>
        ) : null}

        {loadError ? <p className={styles.error}>{loadError}</p> : null}

        {!loadError ? (
          <section className={styles.grid}>
            {toolboxes.map((toolbox) => (
              <article
                key={toolbox.tokenId}
                id={`token-${toolbox.tokenId}`}
                className={styles.card}
              >
                {toolbox.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={toolbox.image}
                    alt={toolbox.name}
                    className={styles.image}
                  />
                ) : null}
                <div className={styles.meta}>
                  <p className={styles.tokenId}>
                    Toolbox #{String(toolbox.tokenId).padStart(3, "0")}
                  </p>
                  <h2 className={styles.name}>{toolbox.name}</h2>
                  {toolbox.ownerLabel ? (
                    <p className={styles.owner}>owned by {toolbox.ownerLabel}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}

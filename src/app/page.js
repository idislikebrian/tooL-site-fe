import Link from "next/link";

import styles from "./page.module.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MintCard from "@/components/MintCard";
import { getContractUrl } from "@/lib/toolContract";

export default function Home() {
  return (
    <div className={styles.page}>
      <Navigation />
      <main className={styles.main}>
        <h1 className={styles.intro}>tooL</h1>
        <ul className={styles.ctas}>
          <li>
            <Link
              href="https://opensea.io/collection/tools-for-builders"
              target="_blank"
              className={styles.primary}
            >
              OpenSea
            </Link>
          </li>
          <li>Workshop (Discord)</li>
          <li>Farcaster</li>
          <li>
            <Link
              href={getContractUrl()}
              target="_blank"
              className={styles.primary}
            >
              Contract
            </Link>
          </li>
        </ul>
        <p className={styles.intro}>
          tooL is a collection of onchain toolkits.
          <br />
          No stats. No instructions. No intended outcome.
          <br />
          Just tools, waiting to be used.
        </p>
        <MintCard />
      </main>
      <Footer />
    </div>
  );
}

import styles from "./page.module.css";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SITE_METADATA_BY_ROUTE } from "@/lib/appConfig";

export const metadata = SITE_METADATA_BY_ROUTE.faq;

export default function FAQPage() {
  return (
    <div className={styles.page}>
      <Navigation />
      <main className={styles.container}>
        <h1 className={styles.title}>Frequently Asked Questions</h1>

        <section className={styles.faq}>
          <h2>What is tooL?</h2>
          <p>
            tooL is a collection of 888 onchain toolkits. Each token represents
            a deterministic set of tools generated entirely from code.
          </p>
          <p>
            The project is forked from the original Loot contract, extending its
            core idea from fantasy gear into tools for building—physical,
            digital, creative, and conceptual.
          </p>
          <p>
            No offchain images. No metadata servers. Just tools, derived from a
            token ID and rendered fully onchain.
          </p>
        </section>

        <section className={styles.faq}>
          <h2>How does collecting work?</h2>
          <p>
            tooL has a max supply of 888. Of those, 777 are public and 111 are
            reserved for admin collection.
          </p>
          <p>
            On mainnet, public collection is free for the first 69 days after
            deployment, plus gas. After that, each public collection costs 0.00111
            ETH.
          </p>
          <p>
            There are two public collection paths. You can claim a specific public
            token ID from 1 to 777, or collect the next available public token.
            The toolset and title are derived deterministically from the token
            ID.
          </p>
        </section>

        <section className={styles.faq}>
          <h2>What is stored onchain?</h2>
          <p>
            The metadata and SVG image are generated onchain by the contract and
            renderer. There are no offchain image files or metadata servers.
          </p>
          <p>
            Titles, context, attributes, and bonus markers all resolve from the
            token ID and contract logic.
          </p>
        </section>

        <section className={styles.faq}>
          <h2>Is tooL audited?</h2>
          <p>
            No. tooL is an experimental, unaudited contract. Use at your own
            risk.
          </p>
        </section>

        <section className={styles.faq}>
          <h2>Why is tooL interesting?</h2>
          <p>
            tooL removes narrative, art direction, and hierarchy at the base
            layer. There is no “correct” interpretation of a toolset.
          </p>
          <p>
            It’s a primitive. A starting point. A substrate for builders,
            writers, designers, and systems thinkers to project meaning onto.
          </p>
        </section>

        <section className={styles.faq}>
          <h2>Can I build with tooL?</h2>
          <p>
            Yes. tooL is intended to be used, remixed, extended, and
            interpreted. Games, identities, stories, registries,
            economies—anything.
          </p>
        </section>

        <section className={styles.faq}>
          <h2>How do I value a tooL?</h2>
          <p>There are no official rarities.</p>
          <p>
            Value can emerge from tool combinations, titles, cultural meaning,
            or downstream use. Or not at all.
          </p>
          <p>Use your own judgment.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

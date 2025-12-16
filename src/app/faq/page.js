import styles from "./page.module.css";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function FAQPage() {
  return (
    <div className={styles.page}>
      <Navigation />
      <main className={styles.container}>
        <h1 className={styles.title}>Frequently Asked Questions</h1>

        <section className={styles.faq}>
          <h2>What is tooL?</h2>
          <p>
            tooL is a collection of 7,777 unique onchain toolkits. Each token
            represents a deterministic set of tools generated entirely from
            code.
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
          <h2>How does minting work?</h2>
          <p>
            At launch, minting is free for a limited window (gas only). After
            that, minting costs a small fixed ETH amount.
          </p>
          <p>
            Minters choose their token ID. The tool set is derived
            deterministically from that ID.
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

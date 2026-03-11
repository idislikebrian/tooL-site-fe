import styles from "./page.module.css";

import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";

export default function ResourcesPage() {
  return (
    <div className={styles.page}>
      <Navigation />
      <main className={styles.container}>
        <p className={styles.kicker}>RESOURCES</p>
        <h1 className={styles.title}>Assembly required.</h1>
        <p className={styles.copy}>
          The manual is not in the box yet.
        </p>
        <p className={styles.copy}>
          References, links, and downstream material are still being sorted into
          place.
        </p>
        <p className={styles.note}>Under construction. Return with tools.</p>
      </main>
      <Footer />
    </div>
  );
}

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      Created by Brian Felix to support the <Link href="https://vroom.fun" target="_blank">$VROOM</Link> liquidity pool.
    </footer>
  );
}
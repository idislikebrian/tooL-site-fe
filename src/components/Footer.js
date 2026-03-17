import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      Created by Brian Felix (
      <a href="farcaster.xyz/chamaquito.eth" target="_blank" rel="noopener noreferrer">
        @chamaquito.eth
      </a>
      ) to support the{" "}
      <Link href="https://vroom.fun" target="_blank">
        $VROOM
      </Link>{" "}
      liquidity pool.
    </footer>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navigation.module.css";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href) => pathname === href;

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          tooL
        </Link>
      </div>

      <div className={styles.right}>
        <Link
          href="/faq"
          className={`${styles.link} ${isActive("/faq") ? styles.active : ""}`}
        >
          FAQ
        </Link>

        <Link
          href="/resources"
          className={`${styles.link} ${
            isActive("/resources") ? styles.active : ""
          }`}
        >
          Resources
        </Link>
      </div>
    </nav>
  );
}

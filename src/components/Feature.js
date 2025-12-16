"use client";

import Link from "next/link";
import styles from "./Feature.module.css";

export default function Feature() {
  return (
    <div className={styles.homeFeature}>
      <span>Example kits:</span>
      <Link
        href="https://opensea.io"
        target="_blank"
        className={styles.homeKit}
      >
        <div className={styles.homeKitAttributes}>
          <span>#111</span>
          <ul>
            <li>Tool 1</li>
            <li>Tool 2</li>
            <li>Tool 3</li>
            <li>Tool 4</li>
            <li>Tool 5</li>
            <li>Tool 6</li>
            <li>Tool 7</li>
            <li>Tool 8</li>
          </ul>
        </div>
      </Link>
      <Link
        href="https://opensea.io"
        target="_blank"
        className={styles.homeKit}
      >
        <div className={styles.homeKitAttributes}>
          <span>#222</span>
          <ul>
            <li>Tool 1</li>
            <li>Tool 2</li>
            <li>Tool 3</li>
            <li>Tool 4</li>
            <li>Tool 5</li>
            <li>Tool 6</li>
            <li>Tool 7</li>
            <li>Tool 8</li>
          </ul>
        </div>
      </Link>
      <Link
        href="https://opensea.io"
        target="_blank"
        className={styles.homeKit}
      >
        <div className={styles.homeKitAttributes}>
          <span>#333</span>
          <ul>
            <li>Tool 1</li>
            <li>Tool 2</li>
            <li>Tool 3</li>
            <li>Tool 4</li>
            <li>Tool 5</li>
            <li>Tool 6</li>
            <li>Tool 7</li>
            <li>Tool 8</li>
          </ul>
        </div>
      </Link>
    </div>
  );
}

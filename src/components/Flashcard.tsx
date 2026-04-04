"use client";

import { useState } from "react";
import styles from "./Flashcard.module.css";

interface FlashcardProps {
  word: string;
  pinyin: string;
  meaning: string;
}

export default function Flashcard({ word, pinyin, meaning }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={`${styles.cardContainer} ${isFlipped ? styles.flipped : ""}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={styles.cardInner}>
        {/* Front */}
        <div className={styles.cardFront}>
          <span className={`${styles.word} hanzi`}>{word}</span>
          <p className={styles.hint}>Click để xem nghĩa</p>
        </div>
        
        {/* Back */}
        <div className={styles.cardBack}>
          <span className={styles.pinyin}>{pinyin}</span>
          <span className={styles.meaning}>{meaning}</span>
          <p className={styles.hint}>Click để xem Hán tự</p>
        </div>
      </div>
    </div>
  );
}

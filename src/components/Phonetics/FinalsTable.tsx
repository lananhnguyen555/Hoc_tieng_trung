import React from 'react';
import styles from './phonetics.module.css';

const FINALS = [
  'a', 'o', 'e', 'i', 'u', 'ü',
  'ai', 'ei', 'ui', 'ao', 'ou', 'iu',
  'ie', 'üe', 'er',
  'an', 'en', 'in', 'un', 'ün',
  'ang', 'eng', 'ing', 'ong'
];

export default function FinalsTable() {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>36 Vận Mẫu (Nguyên âm)</h2>
      <div className={styles.flex}>
        {FINALS.map((item) => (
          <div key={item} className={styles.tag} onClick={() => speak(item)}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

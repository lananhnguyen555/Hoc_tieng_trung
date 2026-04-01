import React from 'react';
import styles from './phonetics.module.css';

const INITIALS = [
  { pinyin: 'b', sound: '[b]', description: 'P-p (như ba)' },
  { pinyin: 'p', sound: '[pʰ]', description: 'P-h (bật hơi)' },
  { pinyin: 'm', sound: '[m]', description: 'M-m (như mẹ)' },
  { pinyin: 'f', sound: '[f]', description: 'Ph-ph (như phở)' },
  { pinyin: 'd', sound: '[d]', description: 'T-t (như đa)' },
  { pinyin: 't', sound: '[tʰ]', description: 'T-h (bật hơi)' },
  { pinyin: 'n', sound: '[n]', description: 'N-n (như na)' },
  { pinyin: 'l', sound: '[l]', description: 'L-l (như la)' },
  { pinyin: 'g', sound: '[k]', description: 'C/K (như cá)' },
  { pinyin: 'k', sound: '[kʰ]', description: 'Kh-kh (bật hơi)' },
  { pinyin: 'h', sound: '[x]', description: 'Kh nhẹ' },
  { pinyin: 'j', sound: '[tɕ]', description: 'Ch-ch (như chi)' },
  { pinyin: 'q', sound: '[tɕʰ]', description: 'Ch (bật hơi)' },
  { pinyin: 'x', sound: '[ɕ]', description: 'X-x (như xi)' },
  { pinyin: 'zh', sound: '[tʂ]', description: 'Tr-tr (không bật hơi)' },
  { pinyin: 'ch', sound: '[tʂʰ]', description: 'Tr (bật hơi)' },
  { pinyin: 'sh', sound: '[ʂ]', description: 'S-s (như sa)' },
  { pinyin: 'r', sound: '[ʐ]', description: 'R-r (như ra)' },
  { pinyin: 'z', sound: '[ts]', description: 'Ch nhẹ' },
  { pinyin: 'c', sound: '[tsʰ]', description: 'Ch (bật hơi nhẹ)' },
  { pinyin: 's', sound: '[s]', description: 'X nhẹ' },
];

export default function InitialsTable() {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>21 Thanh Mẫu (Phụ âm đầu)</h2>
      <div className={styles.grid}>
        {INITIALS.map((item) => (
          <div key={item.pinyin} className={styles.card} onClick={() => speak(item.pinyin)}>
            <div className={styles.pinyin}>{item.pinyin}</div>
            <div className={styles.sound}>{item.sound}</div>
            <div className={styles.desc}>{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

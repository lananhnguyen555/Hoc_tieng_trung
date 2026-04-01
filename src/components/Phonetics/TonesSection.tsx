import React from 'react';
import styles from './phonetics.module.css';

const TONES = [
  { tone: 'ā', name: 'Thanh 1 (Ngang)', hint: 'Cao, bằng - Đọc như a (như "ba")' },
  { tone: 'á', name: 'Thanh 2 (Sắc)', hint: 'Từ thấp lên cao - Đọc như á (như "bá")' },
  { tone: 'ǎ', name: 'Thanh 3 (Hỏi)', hint: 'Xuống thấp rồi lên - Đọc như ả (như "bả")' },
  { tone: 'à', name: 'Thanh 4 (Huyền)', hint: 'Từ cao xuống thấp, dứt khoát - Đọc như à (như "bạ")' },
  { tone: 'a', name: 'Thanh nhẹ', hint: 'Ngắn, nhẹ - Đọc như a không dấu (như "ba")' },
];

export default function TonesSection() {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>4 Thanh Điệu & 1 Thanh Nhẹ</h2>
      <div className={styles.grid}>
        {TONES.map((item) => (
          <div key={item.tone} className={styles.toneCard} onClick={() => speak(item.tone)}>
            <div className={styles.toneChar}>{item.tone}</div>
            <div className={styles.toneName}>{item.name}</div>
            <p className={styles.hint}>{item.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

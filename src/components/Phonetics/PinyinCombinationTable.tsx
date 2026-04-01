import React from 'react';
import styles from './phonetics.module.css';

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS_SAMPLE = ['a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong'];

export default function PinyinCombinationTable() {
  const speak = (initial: string, final: string) => {
    const utterance = new SpeechSynthesisUtterance(initial + final);
    utterance.lang = 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Bảng Ghép Âm Pinyin</h2>
        <p className={styles.subtitle}>Ví dụ bảng ghép Thanh mẫu và Vận mẫu cơ bản. Nhấp vào các ô để nghe phát âm.</p>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2}>Bảng Ghép</th>
              <th colSpan={FINALS_SAMPLE.length}>Vận Mẫu (Sơ đồ cơ bản)</th>
            </tr>
            <tr>
              {FINALS_SAMPLE.map(f => <th key={f}>{f}</th>)}
            </tr>
          </thead>
          <tbody>
            {INITIALS.map(i => (
              <tr key={i}>
                <th>{i}</th>
                {FINALS_SAMPLE.map(f => (
                  <td key={f} onClick={() => speak(i, f)}>
                    <div className={styles.cell}>{i}{f}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

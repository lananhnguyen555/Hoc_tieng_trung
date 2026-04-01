"use client";

import React from 'react';
import styles from './phonetics.module.css';

const INITIALS = [
  { pinyin: 'b', sound: '[pua]', description: 'Đọc là [pua] (kết hợp với "ua")' },
  { pinyin: 'p', sound: '[pua]', description: 'Đọc là [pua] (kèm bật hơi)' },
  { pinyin: 'm', sound: '[mua]', description: 'Đọc là [mua] (kết hợp với "ua")' },
  { pinyin: 'f', sound: '[phua]', description: 'Đọc là [phua] (kết hợp với "ua")' },
  { pinyin: 'd', sound: '[tưa]', description: 'Đọc là [tưa] (kết hợp với "ưa")' },
  { pinyin: 't', sound: '[thưa]', description: 'Đọc là [thưa] (kèm bật hơi)' },
  { pinyin: 'n', sound: '[nưa]', description: 'Đọc là [nưa] (kết hợp với "ưa")' },
  { pinyin: 'l', sound: '[lưa]', description: 'Đọc là [lưa] (kết hợp với "ưa")' },
  { pinyin: 'g', sound: '[cưa]', description: 'Đọc là [cưa] (kết hợp với "ưa")' },
  { pinyin: 'k', sound: '[khưa]', description: 'Đọc là [khưa] (kèm bật hơi)' },
  { pinyin: 'h', sound: '[khưa]', description: 'Đọc là [khưa] (không bật hơi)' },
  { pinyin: 'j', sound: '[chi]', description: 'Đọc là [chi] (kết hợp với "i")' },
  { pinyin: 'q', sound: '[chi]', description: 'Đọc là [chi] (kèm bật hơi)' },
  { pinyin: 'x', sound: '[xi]', description: 'Đọc là [xi] (không bật hơi)' },
  { pinyin: 'z', sound: '[chư]', description: 'Đọc là [chư] (dứt khoát)' },
  { pinyin: 'c', sound: '[chư]', description: 'Đọc là [chư] (kèm bật hơi)' },
  { pinyin: 's', sound: '[xư]', description: 'Đọc là [xư] (không bật hơi)' },
  { pinyin: 'zh', sound: '[trư]', description: 'Đọc là [trư] (không cuốn lưỡi quá nhiều)' },
  { pinyin: 'ch', sound: '[trư]', description: 'Đọc là [trư] (kèm bật hơi)' },
  { pinyin: 'sh', sound: '[sư]', description: 'Đọc là [sư] (cong lưỡi)' },
  { pinyin: 'r', sound: '[rư]', description: 'Đọc tương tự [rư]' },
];

export default function InitialsTable() {
  const speak = (text: string) => {
    if (typeof window === 'undefined') return;
    const utterance = new window.SpeechSynthesisUtterance(text);
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

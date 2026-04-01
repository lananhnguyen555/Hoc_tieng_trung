"use client";

import React from 'react';
import styles from './phonetics.module.css';

const INITIALS = [
  // Nhóm 1: Kết hợp với "o" (đọc là uô/pua)
  { pinyin: 'b', sound: '[pua]', speak: 'bo', description: 'Đọc là [pua] (kết hợp với "ua")' },
  { pinyin: 'p', sound: '[pua]', speak: 'po', description: 'Đọc là [pua] (kèm bật hơi)' },
  { pinyin: 'm', sound: '[mua]', speak: 'mo', description: 'Đọc là [mua] (kết hợp với "ua")' },
  { pinyin: 'f', sound: '[phua]', speak: 'fo', description: 'Đọc là [phua] (kết hợp với "ua")' },
  
  // Nhóm 2 & 3: Kết hợp với "e" (đọc là ưa)
  { pinyin: 'd', sound: '[tưa]', speak: 'de', description: 'Đọc là [tưa] (kết hợp với "ưa")' },
  { pinyin: 't', sound: '[thưa]', speak: 'te', description: 'Đọc là [thưa] (kèm bật hơi)' },
  { pinyin: 'n', sound: '[nưa]', speak: 'ne', description: 'Đọc là [nưa] (kết hợp với "ưa")' },
  { pinyin: 'l', sound: '[lưa]', speak: 'le', description: 'Đọc là [lưa] (kết hợp với "ưa")' },
  { pinyin: 'g', sound: '[cưa]', speak: 'ge', description: 'Đọc là [cưa] (kết hợp với "ưa")' },
  { pinyin: 'k', sound: '[khưa]', speak: 'ke', description: 'Đọc là [khưa] (kèm bật hơi)' },
  { pinyin: 'h', sound: '[khưa]', speak: 'he', description: 'Đọc là [khưa] (không bật hơi)' },
  
  // Nhóm 4: Kết hợp với "i" (đọc là i)
  { pinyin: 'j', sound: '[chi]', speak: 'ji', description: 'Đọc là [chi] (kết hợp với "i")' },
  { pinyin: 'q', sound: '[chi]', speak: 'qi', description: 'Đọc là [chi] (kèm bật hơi)' },
  { pinyin: 'x', sound: '[xi]', speak: 'xi', description: 'Đọc là [xi] (không bật hơi)' },
  
  // Nhóm 5 & 6: Kết hợp với "i" (đọc là ư)
  { pinyin: 'z', sound: '[chư]', speak: 'zi', description: 'Đọc là [chư] (dứt khoát)' },
  { pinyin: 'c', sound: '[chư]', speak: 'ci', description: 'Đọc là [chư] (kèm bật hơi)' },
  { pinyin: 's', sound: '[xư]', speak: 'si', description: 'Đọc là [xư] (không bật hơi)' },
  { pinyin: 'zh', sound: '[trư]', speak: 'zhi', description: 'Đọc là [trư] (không cuốn lưỡi)' },
  { pinyin: 'ch', sound: '[trư]', speak: 'chi', description: 'Đọc là [trư] (kèm bật hơi)' },
  { pinyin: 'sh', sound: '[sư]', speak: 'shi', description: 'Đọc là [sư] (cong lưỡi)' },
  { pinyin: 'r', sound: '[rư]', speak: 'ri', description: 'Đọc tương tự [rư]' },
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
          <div key={item.pinyin} className={styles.card} onClick={() => speak(item.speak)}>
            <div className={styles.pinyin}>{item.pinyin}</div>
            <div className={styles.sound}>{item.sound}</div>
            <div className={styles.desc}>{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

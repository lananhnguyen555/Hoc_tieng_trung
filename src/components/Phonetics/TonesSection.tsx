"use client";

import React from 'react';
import styles from './phonetics.module.css';

const TONES = [
  { tone: 'ā', char: '妈', name: 'Thanh 1 (Ngang)', hint: 'Cao, bằng - Đọc như a (như "ba")' },
  { tone: 'á', char: '麻', name: 'Thanh 2 (Sắc)', hint: 'Từ thấp lên cao - Đọc như á (như "bá")' },
  { tone: 'ǎ', char: '马', name: 'Thanh 3 (Hỏi)', hint: 'Xuống thấp rồi lên - Đọc như ả (như "bả")' },
  { tone: 'à', char: '骂', name: 'Thanh 4 (Dứt khoát)', hint: 'Từ cao xuống thấp, dứt khoát - Đọc như à (như "bạ")' },
  { tone: 'a', char: '嘛', name: 'Thanh nhẹ', hint: 'Ngắn, nhẹ - Đọc như a không dấu (như "ba")' },
];

export default function TonesSection() {
  const speak = (char: string) => {
    if (typeof window === 'undefined') return;
    
    // Stop any previous speech
    window.speechSynthesis.cancel();

    // Use Google TTS with Chinese character for 100% standard tone
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(char)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;
    const audio = new Audio(url);
    audio.play().catch(() => {
      // Fallback
      const utterance = new window.SpeechSynthesisUtterance(char);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    });
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>4 Thanh Điệu &amp; 1 Thanh Nhẹ</h2>
      <div className={styles.grid}>
        {TONES.map((item) => (
          <div key={item.tone} className={styles.toneCard} onClick={() => speak(item.char)}>
            <div className={styles.toneChar}>
              {item.tone} 
              <span className={styles.toneCharExample}>({item.char})</span>
            </div>
            <div className={styles.toneName}>{item.name}</div>
            <p className={styles.hint}>{item.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


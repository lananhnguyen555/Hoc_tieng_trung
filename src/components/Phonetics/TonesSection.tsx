"use client";

import React from 'react';
import styles from './phonetics.module.css';
import { Play } from 'lucide-react';

// Bỏ mảng TONES cũ, thay bằng ảnh

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
      <div className={styles.imageContainer}>
        <img 
          src="/images/tones.png" 
          alt="Sơ đồ 4 thanh điệu tiếng Trung" 
          className={styles.tonesImage}
        />
        <div className={styles.imageOverlay}>
          <p>Nhấn vào các nút phát âm bên dưới để nghe thử ví dụ</p>
          <div className={styles.audioGrid}>
            {['ā/妈', 'á/麻', 'ǎ/马', 'à/骂', 'a/嘛'].map((text) => (
              <button key={text} className={styles.audioBtn} onClick={() => speak(text.split('/')[1])}>
                {text} <Play size={14} style={{marginLeft: 4}} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


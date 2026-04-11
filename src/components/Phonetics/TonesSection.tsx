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
          <p className={styles.overlayHint}>Nhấn vào từng thanh để nghe phát âm minh họa:</p>
          <div className={styles.audioGrid}>
            {[
              { label: 'Thanh 1 (mā)', char: '妈' },
              { label: 'Thanh 2 (má)', char: '麻' },
              { label: 'Thanh 3 (mǎ)', char: '马' },
              { label: 'Thanh 4 (mà)', char: '骂' },
              { label: 'Thanh nhẹ (ma)', char: '嘛' }
            ].map((item) => (
              <button key={item.label} className={styles.audioBtn} onClick={() => speak(item.char)}>
                <span className={styles.btnLabel}>{item.label}</span>
                <Play size={16} fill="currentColor" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


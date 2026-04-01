"use client";

import React, { useState } from 'react';
import styles from './phonetics.module.css';
import { Volume2, X } from 'lucide-react';

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS_SAMPLE = ['a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong'];

// Simple tone mark mapping helper
const addTone = (syllable: string, tone: number) => {
  if (tone === 0) return syllable;
  const marks: Record<string, string[]> = {
    'a': ['a', 'ā', 'á', 'ǎ', 'à'],
    'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
    'e': ['e', 'ē', 'é', 'ě', 'è'],
    'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
    'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
    'ü': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ']
  };

  const priority = ['a', 'o', 'e', 'i', 'u', 'ü'];
  for (const v of priority) {
    if (syllable.includes(v)) {
      return syllable.replace(v, marks[v][tone]);
    }
  }
  return syllable;
};

export default function PinyinCombinationTable() {
  const [activeSyllable, setActiveSyllable] = useState<string | null>(null);

  const playAudio = (text: string) => {
    if (typeof window === 'undefined') return;
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=tw-ob`;
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    });
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Bảng Ghép Âm & Thanh Điệu</h2>
        <p className={styles.subtitle}>Nhấp vào một ô để xem và nghe 4 thanh điệu của âm tiết đó.</p>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Khởi đầu</th>
              {FINALS_SAMPLE.map(f => <th key={f}>{f}</th>)}
            </tr>
          </thead>
          <tbody>
            {INITIALS.map(i => (
              <tr key={i}>
                <th>{i}</th>
                {FINALS_SAMPLE.map(f => (
                  <td key={f} onClick={() => setActiveSyllable(i + f)}>
                    <div className={styles.cell}>{i}{f}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tone Selection Popover */}
      {activeSyllable && (
        <div className={styles.modalOverlay} onClick={() => setActiveSyllable(null)}>
          <div className={styles.tonePopContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popHeader}>
              <h3>Thanh điệu cho: <span className={styles.accentText}>{activeSyllable}</span></h3>
              <button onClick={() => setActiveSyllable(null)}><X size={20}/></button>
            </div>
            <div className={styles.toneGrid}>
              {[1, 2, 3, 4].map(t => {
                const toned = addTone(activeSyllable, t);
                return (
                  <button 
                    key={t} 
                    className={styles.toneBtn}
                    onClick={() => playAudio(toned)}
                  >
                    <span className={styles.tonedChar}>{toned}</span>
                    <span className={styles.toneLabel}>Thanh {t}</span>
                    <Volume2 size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

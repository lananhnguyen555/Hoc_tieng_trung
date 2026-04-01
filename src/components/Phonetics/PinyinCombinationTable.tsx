"use client";

import React, { useState } from 'react';
import styles from './phonetics.module.css';
import { Volume2, X } from 'lucide-react';

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS_SAMPLE = ['a', 'o', 'e', 'i', 'u', 'üe', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'an', 'en', 'in', 'un', 'ang', 'eng', 'ing', 'ong'];

// Simple tone mark mapping helper for display
const addToneMark = (syllable: string, tone: number) => {
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

  const playAudio = (syllable: string, tone: number) => {
    if (typeof window === 'undefined') return;
    
    // To ensure 4-tone distinction, we send the numeric tone to Google TTS
    // Google TTS handles "ba1", "ba2" etc. very well for distinct pitch contours
    const ttsText = tone > 0 ? `${syllable}${tone}` : syllable;
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(ttsText)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;
    
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      const utterance = new window.SpeechSynthesisUtterance(addToneMark(syllable, tone));
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    });
  };

  return (
    <div className={styles.section} id="combination-table">
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Bảng Ghép Âm & Thanh Điệu</h2>
        <p className={styles.subtitle}>Nhấp vào bất kỳ ô nào để nghe phát âm chuẩn 4 thanh điệu.</p>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.fullTable}>
          <thead>
            <tr>
              <th>Vần \ Thanh</th>
              {FINALS_SAMPLE.map(f => <th key={f}>{f}</th>)}
            </tr>
          </thead>
          <tbody>
            {INITIALS.map(i => (
              <tr key={i}>
                <th className={styles.initialHeaderEdge}>{i}</th>
                {FINALS_SAMPLE.map(f => (
                  <td 
                    key={f} 
                    className={styles.pinyinCellClickable}
                    onClick={() => setActiveSyllable(i + f)}
                  >
                    <div className={styles.pinyinCellInner}>{i}{f}</div>
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
              <button 
                className={styles.closeBtnSmall}
                onClick={() => setActiveSyllable(null)}
              >
                <X size={20}/>
              </button>
            </div>
            <div className={styles.toneGrid}>
              {[1, 2, 3, 4].map(t => {
                const toned = addToneMark(activeSyllable, t);
                return (
                  <button 
                    key={t} 
                    className={styles.toneBtnLarge}
                    onClick={() => playAudio(activeSyllable, t)}
                  >
                    <div className={styles.toneVisual}>
                      <span className={styles.tonedCharBig}>{toned}</span>
                      <Volume2 size={20} className={styles.volumeIcon} />
                    </div>
                    <span className={styles.toneDesc}>Thanh {t}</span>
                    <div className={styles.toneHint}>
                      {t === 1 && "— (Ngang)"}
                      {t === 2 && "ˊ (Sắc)"}
                      {t === 3 && "ˇ (Hỏi)"}
                      {t === 4 && "ˋ (Nặng)"}
                    </div>
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

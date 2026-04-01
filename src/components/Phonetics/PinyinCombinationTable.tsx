"use client";

import React, { useState } from 'react';
import styles from './phonetics.module.css';
import { Volume2, X } from 'lucide-react';

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS_SAMPLE = ['a', 'o', 'e', 'i', 'u', 'ai', 'ei', 'ao', 'ou', 'ie', 'an', 'en', 'in', 'ang', 'eng', 'ing', 'ong'];

// Bảng dấu thanh điệu Unicode đầy đủ [0=không dấu, 1=bằng, 2=sắc, 3=hỏi, 4=nặng]
const TONE_MARKS: Record<string, string[]> = {
  'a': ['a', 'ā', 'á', 'ǎ', 'à'],
  'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
  'e': ['e', 'ē', 'é', 'ě', 'è'],
  'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
  'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
  'ü': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

// Thứ tự ưu tiên đặt dấu thanh: a > o > e trước; ui/iu đặc biệt
const VOWEL_PRIORITY = ['a', 'o', 'e', 'ü', 'i', 'u'];

const addToneMark = (syllable: string, tone: number): string => {
  if (tone === 0) return syllable;

  // Quy tắc đặc biệt tiếng Trung Quốc:
  // ui → dấu trên i (vì viết tắt của uei)
  if (syllable.endsWith('ui')) {
    return syllable.slice(0, -1) + (TONE_MARKS['i']?.[tone] ?? 'i');
  }
  // iu → dấu trên u (vì viết tắt của iou)
  if (syllable.endsWith('iu')) {
    return syllable.slice(0, -1) + (TONE_MARKS['u']?.[tone] ?? 'u');
  }

  for (const v of VOWEL_PRIORITY) {
    if (syllable.includes(v) && TONE_MARKS[v]) {
      return syllable.replace(v, TONE_MARKS[v][tone]);
    }
  }
  return syllable;
};

/**
 * Phát âm thanh điệu qua Google Translate TTS với dấu Unicode chuẩn người Trung.
 * Google TTS nhận dấu thanh điệu Unicode và đọc đúng pitch cho từng thanh.
 */
const playWithGoogleTTS = (syllable: string, tone: number) => {
  if (typeof window === 'undefined') return;

  const toned = addToneMark(syllable, tone);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(toned)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;

  const audio = new Audio(url);
  audio.play().catch(() => {
    // Fallback: Web Speech API
    window.speechSynthesis.cancel();
    const utt = new window.SpeechSynthesisUtterance(toned);
    utt.lang = 'zh-CN';
    utt.rate = 0.8;
    window.speechSynthesis.speak(utt);
  });
};

const TONE_INFO = [
  { num: 1, symbol: '—', name: 'Thanh Bằng', desc: 'Đọc cao đều, không lên xuống', color: '#60a5fa' },
  { num: 2, symbol: 'ˊ', name: 'Thanh Dương Bình', desc: 'Từ giữa lên cao dần', color: '#34d399' },
  { num: 3, symbol: 'ˇ', name: 'Thanh Thượng', desc: 'Xuống thấp rồi lên lại', color: '#fbbf24' },
  { num: 4, symbol: 'ˋ', name: 'Thanh Khứ', desc: 'Từ cao xuống thấp mạnh', color: '#f87171' },
];

export default function PinyinCombinationTable() {
  const [activeSyllable, setActiveSyllable] = useState<string | null>(null);

  return (
    <div className={styles.section} id="combination-table">
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Bảng Ghép Âm &amp; Thanh Điệu</h2>
        <p className={styles.subtitle}>Nhấp vào bất kỳ ô nào để nghe phát âm chuẩn 4 thanh điệu.</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.fullTable}>
          <thead>
            <tr>
              <th>Thanh\Vận</th>
              {FINALS_SAMPLE.map(f => <th key={f}>{f}</th>)}
            </tr>
          </thead>
          <tbody>
            {INITIALS.map(initial => (
              <tr key={initial}>
                <th className={styles.initialHeaderEdge}>{initial}</th>
                {FINALS_SAMPLE.map(final => {
                  const syllable = initial + final;
                  return (
                    <td
                      key={final}
                      className={styles.pinyinCellClickable}
                      onClick={() => setActiveSyllable(syllable)}
                    >
                      <div className={styles.pinyinCellInner}>{syllable}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Popover chọn thanh điệu */}
      {activeSyllable && (
        <div className={styles.modalOverlay} onClick={() => setActiveSyllable(null)}>
          <div className={styles.tonePopContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popHeader}>
              <h3>Thanh điệu cho: <span className={styles.accentText}>{activeSyllable}</span></h3>
              <button
                className={styles.closeBtnSmall}
                onClick={() => setActiveSyllable(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.toneGrid}>
              {TONE_INFO.map(({ num, symbol, name, desc, color }) => {
                const toned = addToneMark(activeSyllable, num);
                return (
                  <button
                    key={num}
                    className={styles.toneBtnLarge}
                    onClick={() => playWithGoogleTTS(activeSyllable, num)}
                    style={{ borderColor: color + '66' }}
                  >
                    <div className={styles.toneVisual}>
                      <span className={styles.tonedCharBig} style={{ color }}>{toned}</span>
                      <Volume2 size={20} className={styles.volumeIcon} />
                    </div>
                    <span className={styles.toneDesc} style={{ color }}>
                      {name} {symbol}
                    </span>
                    <div className={styles.toneHint}>{desc}</div>
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

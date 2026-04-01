"use client";

import React, { useState } from 'react';
import styles from './phonetics.module.css';
import { Volume2, X } from 'lucide-react';

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS_SAMPLE = ['a', 'o', 'e', 'i', 'u', 'ai', 'ei', 'ao', 'ou', 'ie', 'an', 'en', 'in', 'ang', 'eng', 'ing', 'ong'];

// Bảng dấu thanh điệu đầy đủ cho từng nguyên âm
const TONE_MARKS: Record<string, string[]> = {
  'a': ['a', 'ā', 'á', 'ǎ', 'à'],
  'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
  'e': ['e', 'ē', 'é', 'ě', 'è'],
  'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
  'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
  'ü': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

// Thứ tự ưu tiên đặt dấu: a > o > e > i/u (khi đứng riêng)
const VOWEL_PRIORITY = ['a', 'o', 'e', 'ü', 'i', 'u'];

/**
 * Thêm dấu thanh điệu vào âm tiết bằng dấu Unicode thực sự.
 * Đây là cách ĐÚNG duy nhất để Web Speech API đọc đúng thanh điệu tiếng Trung.
 */
const addToneMark = (syllable: string, tone: number): string => {
  if (tone === 0) return syllable;

  // Quy tắc đặc biệt: ui → dấu trên i, iu → dấu trên u
  if (syllable.endsWith('ui')) {
    return syllable.slice(0, -1) + (TONE_MARKS['i'][tone] || 'i');
  }
  if (syllable.endsWith('iu')) {
    return syllable.slice(0, -1) + (TONE_MARKS['u'][tone] || 'u');
  }

  for (const v of VOWEL_PRIORITY) {
    if (syllable.includes(v) && TONE_MARKS[v]) {
      return syllable.replace(v, TONE_MARKS[v][tone]);
    }
  }
  return syllable;
};

/**
 * Phát âm bằng Web Speech API với dấu thanh điệu Unicode thực sự.
 * Đây là cách đáng tin cậy nhất để phân biệt 4 thanh điệu trong trình duyệt.
 */
const speakSyllable = (syllable: string, tone: number) => {
  if (typeof window === 'undefined') return;

  const toned = addToneMark(syllable, tone);
  window.speechSynthesis.cancel();

  const utterance = new window.SpeechSynthesisUtterance(toned);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.8;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};

const TONE_INFO = [
  { num: 1, symbol: '—', name: 'Ngang', desc: 'Đọc đều, cao, không lên xuống', color: '#60a5fa' },
  { num: 2, symbol: 'ˊ', name: 'Sắc', desc: 'Đọc lên từ giữa lên cao', color: '#34d399' },
  { num: 3, symbol: 'ˇ', name: 'Hỏi', desc: 'Xuống rồi lên lại (xuống-hỏi)', color: '#fbbf24' },
  { num: 4, symbol: 'ˋ', name: 'Nặng', desc: 'Đọc xuống thật mạnh', color: '#f87171' },
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
                    onClick={() => speakSyllable(activeSyllable, num)}
                    style={{ borderColor: color }}
                  >
                    <div className={styles.toneVisual}>
                      <span className={styles.tonedCharBig} style={{ color }}>{toned}</span>
                      <Volume2 size={20} className={styles.volumeIcon} />
                    </div>
                    <span className={styles.toneDesc} style={{ color }}>Thanh {num} {symbol}</span>
                    <div className={styles.toneHint}>{name} — {desc}</div>
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

"use client";

import React from 'react';
import styles from './phonetics.module.css';
import { Volume2 } from 'lucide-react';

/**
 * Audio chuẩn người Trung từ Prep.edu.vn CDN cho vận mẫu đơn.
 */
const PREP_AUDIO: Record<string, string> = {
  'a': 'https://static-assets.prepcdn.com/content-management-system/bai_1_fix_mp3cut_net_336e4eb225.m4a',
  'o': 'https://static-assets.prepcdn.com/content-management-system/o_73f74bdecc.mp3',
  'e': 'https://static-assets.prepcdn.com/content-management-system/e_c06eba6582.mp3',
  'i': 'https://static-assets.prepcdn.com/content-management-system/i_8603e681d4.mp3',
  'u': 'https://static-assets.prepcdn.com/content-management-system/u_1f9fe0a647.mp3',
  'ü': 'https://static-assets.prepcdn.com/content-management-system/ue_f5050fba07.mp3',
};

/**
 * Bản đồ vận mẫu → dấu thanh bằng (thanh 1) Unicode chính xác để Google TTS đọc đúng.
 * Google Translate TTS với dấu thanh Unicode cho âm chuẩn người Trung.
 */
const TONE1_PINYIN: Record<string, string> = {
  // Vận mẫu đơn (đã có Prep audio, fallback dùng TTS)
  'a': 'ā',   'o': 'ō',   'e': 'ē',   'i': 'ī',   'u': 'ū',   'ü': 'ǖ',
  // Vận mẫu kép
  'ai': 'āi',  'ei': 'ēi',  'ui': 'uēi', 'ao': 'āo',  'ou': 'ōu',
  'iu': 'iōu', 'ie': 'iē',  'üe': 'üē',  'er': 'ēr',
  // Vận mẫu mũi ngắn
  'an': 'ān',  'en': 'ēn',  'in': 'īn',  'un': 'ūn', 'ün': 'ǖn',
  // Vận mẫu mũi dài
  'ang': 'āng', 'eng': 'ēng', 'ing': 'īng', 'ong': 'ōng',
  // Vận mẫu phức hợp
  'ian': 'iān', 'uan': 'uān', 'üan': 'üān',
  'iang': 'iāng', 'uang': 'uāng', 'ueng': 'uēng',
  'iong': 'iōng',
};

const FINAL_GROUPS = [
  {
    name: "Vận mẫu đơn",
    items: [
      { pinyin: 'a',  sound: 'a',        instruction: "Há miệng rộng, phát âm như 'a' trong tiếng Việt." },
      { pinyin: 'o',  sound: 'ô',        instruction: "Môi tròn, phát âm gần như 'ô' trong tiếng Việt." },
      { pinyin: 'e',  sound: 'ơ / ưa',   instruction: "Miệng hé, không tròn môi, khác 'e' tiếng Việt." },
      { pinyin: 'i',  sound: 'i',        instruction: "Phát âm như 'i' trong tiếng Việt, kéo dài." },
      { pinyin: 'u',  sound: 'u',        instruction: "Môi tròn, phát âm như 'u' trong tiếng Việt." },
      { pinyin: 'ü',  sound: 'uy tròn',  instruction: "Phát 'i' rồi tròn môi lại như 'u'. Không có trong tiếng Việt." },
    ]
  },
  {
    name: "Vận mẫu kép",
    items: [
      { pinyin: 'ai', sound: 'ai',       instruction: "Kéo dài 'a' rồi lướt sang 'i'." },
      { pinyin: 'ei', sound: 'ây',       instruction: "Đọc như 'ây' trong tiếng Việt." },
      { pinyin: 'ui', sound: 'uây',      instruction: "Viết tắt của 'uei'. Đọc: u-ê-i." },
      { pinyin: 'ao', sound: 'ao',       instruction: "Như 'ao' tiếng Việt, nhấn vào 'a'." },
      { pinyin: 'ou', sound: 'âu',       instruction: "Đọc như 'âu' trong tiếng Việt." },
      { pinyin: 'iu', sound: 'iêu',      instruction: "Viết tắt của 'iou'. Đọc: i-ô-u." },
      { pinyin: 'ie', sound: 'iê',       instruction: "Đọc như 'iê', nhấn vào 'e'." },
      { pinyin: 'üe', sound: 'uê tròn', instruction: "Như 'üe': ü + ê, môi tròn." },
      { pinyin: 'er', sound: 'ơ uốn lưỡi', instruction: "Đọc 'ơ' rồi uốn lưỡi lên (âm erhua)." },
    ]
  },
  {
    name: "Vận mẫu mũi ngắn (-n)",
    items: [
      { pinyin: 'an',  sound: 'an',      instruction: "Như 'an' tiếng Việt." },
      { pinyin: 'en',  sound: 'ân',      instruction: "Như 'ân' tiếng Việt." },
      { pinyin: 'in',  sound: 'in',      instruction: "Như 'in' tiếng Việt." },
      { pinyin: 'un',  sound: 'uân',     instruction: "Viết tắt của 'uen'. Đọc: u-ê-n." },
      { pinyin: 'ün',  sound: 'ün tròn', instruction: "Như 'ün': ü nasalized, môi tròn." },
    ]
  },
  {
    name: "Vận mẫu mũi dài (-ng)",
    items: [
      { pinyin: 'ang', sound: 'ang',     instruction: "Như 'ang' tiếng Việt, vang hơn." },
      { pinyin: 'eng', sound: 'âng',     instruction: "Như 'âng' tiếng Việt." },
      { pinyin: 'ing', sound: 'ing',     instruction: "Như 'ing' tiếng Việt." },
      { pinyin: 'ong', sound: 'ung',     instruction: "Đọc như 'ung' với âm tròn." },
    ]
  }
];

/**
 * Phát âm qua Google Translate TTS với dấu thanh Unicode chuẩn.
 * Âm thanh chất lượng cao, đọc đúng chuẩn người Trung.
 */
const playGoogleTTS = (toned: string) => {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(toned)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;
  new Audio(url).play().catch(() => {
    // Fallback Web Speech API nếu Google TTS bị chặn
    if (typeof window !== 'undefined') {
      const utt = new window.SpeechSynthesisUtterance(toned);
      utt.lang = 'zh-CN';
      utt.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
  });
};

export default function FinalsTable() {
  const playAudio = (pinyin: string) => {
    if (typeof window === 'undefined') return;

    // Ưu tiên audio gốc chuẩn người Trung từ Prep.edu.vn CDN
    const prepUrl = PREP_AUDIO[pinyin];
    if (prepUrl) {
      new Audio(prepUrl).play().catch(() => {
        const toned = TONE1_PINYIN[pinyin] || pinyin;
        playGoogleTTS(toned);
      });
      return;
    }

    // Các vận mẫu còn lại: Google TTS với dấu thanh 1 Unicode
    const toned = TONE1_PINYIN[pinyin] || pinyin;
    playGoogleTTS(toned);
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>36 Vận Mẫu (Nguyên âm)</h2>
      <p className={styles.subtitle}>Phát âm chuẩn → Cách đọc → Hướng dẫn chi tiết</p>

      <div className={styles.tableWrapper}>
        <table className={styles.pinyinTable}>
          <thead>
            <tr>
              <th>Vận mẫu</th>
              <th>Nghe âm</th>
              <th>Cách đọc (Gần giống)</th>
              <th>Hướng dẫn phát âm</th>
            </tr>
          </thead>
          <tbody>
            {FINAL_GROUPS.map((group) => (
              <React.Fragment key={group.name}>
                <tr className={styles.groupRow}>
                  <td colSpan={4}>{group.name}</td>
                </tr>
                {group.items.map((item) => (
                  <tr key={item.pinyin} className={styles.dataRow}>
                    <td className={styles.pinyinCell}>{item.pinyin}</td>
                    <td>
                      <button
                        className={styles.playBtn}
                        onClick={() => playAudio(item.pinyin)}
                        title={`Nghe âm: ${item.pinyin}`}
                      >
                        <Volume2 size={20} />
                      </button>
                    </td>
                    <td className={styles.soundCell}>{item.sound}</td>
                    <td className={styles.instructionCell}>{item.instruction}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

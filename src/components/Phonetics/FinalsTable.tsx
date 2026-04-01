"use client";

import React from 'react';
import styles from './phonetics.module.css';
import { Volume2 } from 'lucide-react';

const PREP_AUDIO: Record<string, string> = {
  'a': 'https://static-assets.prepcdn.com/content-management-system/bai_1_fix_mp3cut_net_336e4eb225.m4a',
  'o': 'https://static-assets.prepcdn.com/content-management-system/o_73f74bdecc.mp3',
  'e': 'https://static-assets.prepcdn.com/content-management-system/e_c06eba6582.mp3',
  'i': 'https://static-assets.prepcdn.com/content-management-system/i_8603e681d4.mp3',
  'u': 'https://static-assets.prepcdn.com/content-management-system/u_1f9fe0a647.mp3',
  'ü': 'https://static-assets.prepcdn.com/content-management-system/ue_f5050fba07.mp3',
};

// Dấu thanh điệu 1 (bằng) để phát âm chuẩn qua Web Speech API
const TONE1_MAP: Record<string, string> = {
  'a': 'ā', 'o': 'ō', 'e': 'ē', 'i': 'ī', 'u': 'ū', 'ü': 'ǖ',
  'ai': 'āi', 'ei': 'ēi', 'ui': 'uēi', 'ao': 'āo', 'ou': 'ōu',
  'iu': 'iōu', 'ie': 'iē', 'üe': 'üē', 'er': 'ēr',
  'an': 'ān', 'en': 'ēn', 'in': 'īn', 'un': 'ūn', 'ün': 'ǖn',
  'ang': 'āng', 'eng': 'ēng', 'ing': 'īng', 'ong': 'ōng',
};

const FINAL_GROUPS = [
  {
    name: "Vận mẫu đơn",
    items: [
      { pinyin: 'a', sound: 'a', instruction: "Phát âm như 'a' trong tiếng Việt." },
      { pinyin: 'o', sound: 'ô', instruction: "Phát âm gần như 'ô' trong tiếng Việt." },
      { pinyin: 'e', sound: 'ưa / ơ', instruction: "Phát âm gần như 'ưa' (hoặc 'ơ') trong tiếng Việt." },
      { pinyin: 'i', sound: 'i', instruction: "Phát âm như 'i' trong tiếng Việt." },
      { pinyin: 'u', sound: 'u', instruction: "Phát âm như 'u' trong tiếng Việt." },
      { pinyin: 'ü', sound: 'uy', instruction: "Phát âm như 'uy' nhưng môi giữ tròn." },
    ]
  },
  {
    name: "Vận mẫu kép",
    items: [
      { pinyin: 'ai', sound: 'ai', instruction: "Đọc như 'ai' (kéo dài âm a rồi lướt sang i)." },
      { pinyin: 'ei', sound: 'ây', instruction: "Đọc như 'ây' trong bộ gõ tiếng Việt." },
      { pinyin: 'ui', sound: 'uây', instruction: "Viết tắt của 'uei', đọc là 'uây'." },
      { pinyin: 'ao', sound: 'ao', instruction: "Đọc như 'ao' trong tiếng Việt." },
      { pinyin: 'ou', sound: 'âu', instruction: "Đọc như 'âu' trong tiếng Việt." },
      { pinyin: 'iu', sound: 'iêu', instruction: "Viết tắt của 'iou', đọc như 'iêu'." },
      { pinyin: 'ie', sound: 'iê', instruction: "Đọc như 'iê' hoặc 'i-ê'." },
      { pinyin: 'üe', sound: 'uê', instruction: "Đọc như 'uê' với môi tròn." },
      { pinyin: 'er', sound: 'ơ (uốn lưỡi)', instruction: "Âm cong lưỡi. Đọc như 'ơ' rồi uốn lưỡi lên." },
    ]
  },
  {
    name: "Vận mẫu mũi",
    items: [
      { pinyin: 'an', sound: 'an', instruction: "Đọc như 'an' trong tiếng Việt." },
      { pinyin: 'en', sound: 'ân', instruction: "Đọc như 'ân' trong tiếng Việt." },
      { pinyin: 'in', sound: 'in', instruction: "Đọc như 'in' trong tiếng Việt." },
      { pinyin: 'un', sound: 'uân', instruction: "Viết tắt của 'uen', đọc là 'uân'." },
      { pinyin: 'ün', sound: 'uyn', instruction: "Đọc là 'uyn' với môi tròn." },
      { pinyin: 'ang', sound: 'ang', instruction: "Đọc như 'ang' trong tiếng Việt." },
      { pinyin: 'eng', sound: 'âng', instruction: "Đọc như 'âng' trong tiếng Việt." },
      { pinyin: 'ing', sound: 'ing', instruction: "Đọc như 'ing' trong tiếng Việt." },
      { pinyin: 'ong', sound: 'ung', instruction: "Đọc như 'ung' nhưng có độ vang." },
    ]
  }
];

export default function FinalsTable() {
  const playAudio = (pinyin: string) => {
    if (typeof window === 'undefined') return;

    // Ưu tiên audio Prep cho vận mẫu đơn
    const prepUrl = PREP_AUDIO[pinyin];
    if (prepUrl) {
      new Audio(prepUrl).play().catch(() => speakWithTTS(pinyin));
      return;
    }

    // Dùng Web Speech API với dấu thanh 1 để phát âm đúng
    speakWithTTS(pinyin);
  };

  const speakWithTTS = (pinyin: string) => {
    if (typeof window === 'undefined') return;
    const toned = TONE1_MAP[pinyin] || pinyin;
    const utterance = new window.SpeechSynthesisUtterance(toned);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>36 Vận Mẫu (Nguyên âm)</h2>
      <p className={styles.subtitle}>Phát âm chuẩn Prep → Kết hợp → Cách đọc</p>

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
                      <button className={styles.playBtn} onClick={() => playAudio(item.pinyin)}>
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

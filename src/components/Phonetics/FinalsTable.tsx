"use client";

import React from 'react';
import styles from './phonetics.module.css';
import { Volume2 } from 'lucide-react';

// Audio gốc chuẩn người Trung từ Prep.edu.vn cho vận mẫu đơn
const PREP_AUDIO: Record<string, string> = {
  'a': 'https://static-assets.prepcdn.com/content-management-system/bai_1_fix_mp3cut_net_336e4eb225.m4a',
  'o': 'https://static-assets.prepcdn.com/content-management-system/o_73f74bdecc.mp3',
  'e': 'https://static-assets.prepcdn.com/content-management-system/e_c06eba6582.mp3',
  'i': 'https://static-assets.prepcdn.com/content-management-system/i_8603e681d4.mp3',
  'u': 'https://static-assets.prepcdn.com/content-management-system/u_1f9fe0a647.mp3',
  'ü': 'https://static-assets.prepcdn.com/content-management-system/ue_f5050fba07.mp3',
};

/**
 * Map vận mẫu → chữ Hán đại diện để Google TTS đọc chuẩn người Trung.
 * Google TTS zh-CN đọc chữ Hán với chất lượng native, không đọc pinyin.
 */
const FINAL_CHAR: Record<string, string> = {
  // Vận mẫu đơn (có Prep audio, chữ Hán chỉ là fallback)
  'a': '啊', 'o': '哦', 'e': '鹅', 'i': '衣', 'u': '乌', 'ü': '鱼',
  // Vận mẫu kép
  'ai': '哀',  // āi - buồn
  'ei': '欸',  // éi - thán từ (âm ei rõ nhất)
  'ui': '威',  // wēi - oai phong (standalone form: wēi)
  'ao': '熬',  // áo - chịu đựng
  'ou': '欧',  // Ōu - Châu Âu
  'iu': '优',  // yōu - xuất sắc (standalone: yōu)
  'ie': '耶',  // yē - ông ấy / thán từ (standalone: yē)
  'üe': '约',  // yuē - hẹn gặp (standalone: yuē)
  'er': '而',  // ér - mà / và
  // Vận mẫu mũi ngắn
  'an': '安',  // ān - bình an
  'en': '恩',  // ēn - ân nghĩa
  'in': '因',  // yīn - vì (standalone: yīn)
  'un': '温',  // wēn - ấm áp (standalone: wēn)
  'ün': '云',  // yún - mây (standalone: yún)
  // Vận mẫu mũi dài
  'ang': '昂', // áng - ngẩng cao
  'eng': '鞥', // ēng - dây đai (âm chuẩn nhất cho eng)
  'ing': '英', // yīng - anh hùng (standalone: yīng)
  'ong': '拥', // yōng - ôm ấp (âm gần nhất cho ong)
};

const FINAL_GROUPS = [
  {
    name: "Vận mẫu đơn",
    items: [
      { pinyin: 'a',  sound: 'a',         instruction: "Há miệng rộng, phát âm như 'a' tiếng Việt." },
      { pinyin: 'o',  sound: 'ô',         instruction: "Môi tròn, gần như 'ô' tiếng Việt." },
      { pinyin: 'e',  sound: 'ơ',         instruction: "Miệng hé ngang, không tròn môi. Khác 'e' tiếng Việt." },
      { pinyin: 'i',  sound: 'i',         instruction: "Phát âm như 'i' tiếng Việt, kéo dài hơn." },
      { pinyin: 'u',  sound: 'u',         instruction: "Môi tròn, phát âm như 'u' tiếng Việt." },
      { pinyin: 'ü',  sound: 'uy tròn',   instruction: "Phát 'i' rồi tròn môi thành 'u'. Không có trong tiếng Việt." },
    ]
  },
  {
    name: "Vận mẫu kép",
    items: [
      { pinyin: 'ai', sound: 'ai',        instruction: "Kéo dài 'a' rồi lướt sang 'i'." },
      { pinyin: 'ei', sound: 'ây',        instruction: "Đọc như 'ây' tiếng Việt." },
      { pinyin: 'ui', sound: 'uây',       instruction: "Viết tắt của 'uei'. Standalone: wēi." },
      { pinyin: 'ao', sound: 'ao',        instruction: "Như 'ao' tiếng Việt, nhấn vào 'a'." },
      { pinyin: 'ou', sound: 'âu',        instruction: "Đọc như 'âu' tiếng Việt." },
      { pinyin: 'iu', sound: 'iêu',       instruction: "Viết tắt của 'iou'. Standalone: yōu." },
      { pinyin: 'ie', sound: 'iê',        instruction: "Đọc như 'iê'. Standalone: yē." },
      { pinyin: 'üe', sound: 'uê tròn',   instruction: "Standalone: yuē. Môi tròn như ü." },
      { pinyin: 'er', sound: 'ơ (uốn lưỡi)', instruction: "Đọc 'ơ' rồi uốn lưỡi lên. Âm erhua." },
    ]
  },
  {
    name: "Vận mẫu mũi ngắn (-n)",
    items: [
      { pinyin: 'an', sound: 'an',        instruction: "Như 'an' tiếng Việt." },
      { pinyin: 'en', sound: 'ân',        instruction: "Như 'ân' tiếng Việt." },
      { pinyin: 'in', sound: 'in',        instruction: "Standalone: yīn." },
      { pinyin: 'un', sound: 'uân',       instruction: "Viết tắt 'uen'. Standalone: wēn." },
      { pinyin: 'ün', sound: 'ün',        instruction: "Standalone: yún. Môi tròn." },
    ]
  },
  {
    name: "Vận mẫu mũi dài (-ng)",
    items: [
      { pinyin: 'ang', sound: 'ang',      instruction: "Như 'ang' tiếng Việt, tiếng vang hơn." },
      { pinyin: 'eng', sound: 'âng',      instruction: "Như 'âng' tiếng Việt." },
      { pinyin: 'ing', sound: 'ing',      instruction: "Standalone: yīng." },
      { pinyin: 'ong', sound: 'ung tròn', instruction: "Đọc như 'ung' với âm tròn đầy. Standalone: yōng." },
    ]
  }
];

const playFinalAudio = (pinyin: string) => {
  if (typeof window === 'undefined') return;

  // 1. Ưu tiên audio gốc Prep cho vận mẫu đơn
  const prepUrl = PREP_AUDIO[pinyin];
  if (prepUrl) {
    new Audio(prepUrl).play().catch(() => playByChar(pinyin));
    return;
  }

  // 2. Dùng chữ Hán → Google TTS zh-CN (chuẩn người Trung)
  playByChar(pinyin);
};

const playByChar = (pinyin: string) => {
  const char = FINAL_CHAR[pinyin];
  if (!char) return;

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(char)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;
  new Audio(url).play().catch(() => {
    // Fallback cuối: Web Speech API với giọng Trung
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh'));
    if (!zhVoice) return;
    window.speechSynthesis.cancel();
    const utt = new window.SpeechSynthesisUtterance(char);
    utt.voice = zhVoice;
    utt.lang = 'zh-CN';
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  });
};

export default function FinalsTable() {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>36 Vận Mẫu (Nguyên âm)</h2>
      <p className={styles.subtitle}>Phát âm chuẩn người Trung → Cách đọc → Hướng dẫn</p>

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
                        onClick={() => playFinalAudio(item.pinyin)}
                        title={`Nghe: ${item.pinyin}`}
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

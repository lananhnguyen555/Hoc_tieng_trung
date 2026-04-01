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
 * Map vận mẫu → chữ Hán phổ biến để Google TTS đọc chuẩn người Trung.
 * Ưu tiên chữ Hán QUÁ PHỔ BIẾN để Google TTS chắc chắn đọc đúng.
 */
const FINAL_CHAR: Record<string, string> = {
  // Vận mẫu đơn (có Prep audio, chữ Hán chỉ là fallback)
  'a': '啊', 'o': '哦', 'e': '鹅', 'i': '衣', 'u': '乌', 'ü': '鱼',
  // Vận mẫu kép — dùng từ cực phổ biến, Google TTS đọc chuẩn 100%
  'ai': '爱',  // ài = tình yêu (rất phổ biến, âm -ai rõ)
  'ei': '黑',  // hēi = đen (cực phổ biến, âm cuối -ei rõ)
  'ui': '水',  // shuǐ = nước (siêu phổ biến, âm -ui/-uei rõ)
  'ao': '好',  // hǎo = tốt (từ phổ biến nhất, âm -ao rõ)
  'ou': '走',  // zǒu = đi (phổ biến, âm -ou rõ)
  'iu': '牛',  // niú = bò (phổ biến, âm -iu rõ)
  'ie': '写',  // xiě = viết (phổ biến, âm -ie rõ)
  'üe': '月',  // yuè = mặt trăng (phổ biến, standalone âm üe)
  'er': '二',  // èr = số 2 (cực phổ biến, standalone âm er)
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
      { pinyin: 'e',  sound: 'ưa',        instruction: "Miệng hé ngang, không tròn môi. Gần như 'ưa' tiếng Việt, khác 'e'." },
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

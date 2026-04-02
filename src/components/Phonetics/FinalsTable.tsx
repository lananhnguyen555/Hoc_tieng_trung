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
  'ai': 'https://static-assets.prepcdn.com/content-management-system/ai_58561b30d2.mp3',
  'ei': 'https://static-assets.prepcdn.com/content-management-system/ei_acdda1c48d.mp3',
  'ui': 'https://static-assets.prepcdn.com/content-management-system/ui_713ccaab02.mp3',
  'ao': 'https://static-assets.prepcdn.com/content-management-system/ao_d503dd0b47.mp3',
  'ou': 'https://static-assets.prepcdn.com/content-management-system/ou_8b76b05e36.mp3',
  'ie': 'https://static-assets.prepcdn.com/content-management-system/ie_5ec596fdcf.mp3',
  'üe': 'https://static-assets.prepcdn.com/content-management-system/uee_4683c57932.mp3',
  'er': 'https://static-assets.prepcdn.com/content-management-system/er_dfaed74852.mp3',
  'an': 'https://static-assets.prepcdn.com/content-management-system/an_9891f2f6ce.mp3',
  'en': 'https://static-assets.prepcdn.com/content-management-system/en_1bf99e7eea.mp3',
  'in': 'https://static-assets.prepcdn.com/content-management-system/in_184bc5592a.mp3',
  'un': 'https://static-assets.prepcdn.com/content-management-system/un_c9c59c31fc.mp3',
  'ang': 'https://static-assets.prepcdn.com/content-management-system/ang_d7e5fa513e.mp3',
  'eng': 'https://static-assets.prepcdn.com/content-management-system/eng_a36ff361f1.mp3',
  'ing': 'https://static-assets.prepcdn.com/content-management-system/ing_eb4c50f87b.mp3',
  'ong': 'https://static-assets.prepcdn.com/content-management-system/ong_2e0a850f2c.mp3',
};

/**
 * Map vận mẫu → chữ Hán phổ biến để Google TTS đọc chuẩn người Trung.
 * Ưu tiên chữ Hán QUÁ PHỔ BIẾN để Google TTS chắc chắn đọc đúng âm đó.
 */
const FINAL_CHAR: Record<string, string> = {
  // Đơn
  'a': '啊', 'o': '喔', 'e': '鹅', 'i': '衣', 'u': '乌', 'ü': '淤',
  // Kép
  'ai': '爱', 'ei': '欸', 'ui': '威', 'ao': '奥', 'ou': '欧', 'iu': '优', 'ie': '耶', 'üe': '约', 'er': '二',
  'ia': '呀', 'iao': '腰', 'ua': '蛙', 'uo': '窝', 'uai': '歪',
  // Mũi
  'an': '安', 'en': '恩', 'in': '因', 'un': '温', 'ün': '云', 'ian': '烟', 'uan': '弯', 'üan': '冤',
  'ang': '昂', 'eng': '鞥', 'ing': '英', 'ong': '翁', 'iang': '央', 'uang': '汪', 'iong': '用'
};

const FINAL_GROUPS = [
  {
    name: "Vận mẫu đơn (6)",
    items: [
      { pinyin: 'a',  sound: 'a',         instruction: "Há miệng rộng, phát âm như 'a' tiếng Việt." },
      { pinyin: 'o',  sound: 'ô',         instruction: "Môi tròn, gần như 'ô' tiếng Việt." },
      { pinyin: 'e',  sound: 'ưa',        instruction: "Miệng hé ngang, không tròn môi. Gần như 'ưa' tiếng Việt." },
      { pinyin: 'i',  sound: 'i',         instruction: "Phát âm như 'i' tiếng Việt, kéo dài hơn." },
      { pinyin: 'u',  sound: 'u',         instruction: "Môi tròn, phát âm như 'u' tiếng Việt." },
      { pinyin: 'ü',  sound: 'uy tròn',   instruction: "Phát 'i' rồi tròn môi thành 'u'. Không có trong tiếng Việt." },
    ]
  },
  {
    name: "Vận mẫu kép (13)",
    items: [
      { pinyin: 'ai', sound: 'ai',        instruction: "Kéo dài 'a' rồi lướt sang 'i'." },
      { pinyin: 'ei', sound: 'ây',        instruction: "Đọc như 'ây' tiếng Việt." },
      { pinyin: 'ui', sound: 'uây',       instruction: "Viết tắt của 'uei'. Như 'uây' tiếng Việt." },
      { pinyin: 'ao', sound: 'ao',        instruction: "Như 'ao' tiếng Việt, nhấn vào 'a'." },
      { pinyin: 'ou', sound: 'âu',        instruction: "Đọc như 'âu' tiếng Việt." },
      { pinyin: 'iu', sound: 'iêu',       instruction: "Viết tắt của 'iou'. Như 'iêu' tiếng Việt." },
      { pinyin: 'ie', sound: 'iê',        instruction: "Đọc như 'iê' tiếng Việt." },
      { pinyin: 'ia', sound: 'ia',        instruction: "Lướt từ 'i' sang 'a' nhanh." },
      { pinyin: 'iao',sound: 'ieo',       instruction: "Lướt từ 'i' sang 'ao'." },
      { pinyin: 'ua', sound: 'oa',        instruction: "Lướt từ 'u' sang 'a'." },
      { pinyin: 'uo', sound: 'uô',        instruction: "Lướt từ 'u' sang 'o'." },
      { pinyin: 'uai',sound: 'oai',       instruction: "Lướt từ 'u' sang 'ai'." },
      { pinyin: 'üe', sound: 'uê tròn',   instruction: "Lướt từ 'ü' sang 'e'. Môi tròn." },
    ]
  },
  {
    name: "Vận mẫu mũi (16)",
    items: [
      { pinyin: 'an',  sound: 'an',       instruction: "Như 'an' tiếng Việt." },
      { pinyin: 'en',  sound: 'ân',       instruction: "Như 'ân' tiếng Việt." },
      { pinyin: 'in',  sound: 'in',       instruction: "Như 'in' tiếng Việt." },
      { pinyin: 'un',  sound: 'uân',      instruction: "Viết tắt 'uen'. Như 'uân'." },
      { pinyin: 'ün',  sound: 'ün',       instruction: "Môi tròn, kết thúc ở âm 'n'." },
      { pinyin: 'ian', sound: 'ien',      instruction: "Lướt từ 'i' sang 'an'." },
      { pinyin: 'uan', sound: 'oan',      instruction: "Lướt từ 'u' sang 'an'." },
      { pinyin: 'üan', sound: 'üan',      instruction: "Môi tròn, lướt sang 'an'." },
      { pinyin: 'ang', sound: 'ang',      instruction: "Như 'ang' tiếng Việt, họng mở." },
      { pinyin: 'eng', sound: 'âng',      instruction: "Như 'âng' tiếng Việt." },
      { pinyin: 'ing', sound: 'inh',      instruction: "Như 'inh' tiếng Việt." },
      { pinyin: 'ong', sound: 'ung tròn', instruction: "Đọc 'ung' với môi tròn đầy." },
      { pinyin: 'iang',sound: 'iang',     instruction: "Lướt từ 'i' sang 'ang'." },
      { pinyin: 'uang',sound: 'oang',     instruction: "Lướt từ 'u' sang 'ang'." },
      { pinyin: 'iong',sound: 'iung',     instruction: "Lướt từ 'i' sang 'ong'." },
    ]
  },
  {
    name: "Vận mẫu uốn lưỡi (1)",
    items: [
      { pinyin: 'er', sound: 'ơ (uốn lưỡi)', instruction: "Đọc 'ơ' rồi uốn lưỡi lên." },
    ]
  }
];

const playFinalAudio = (pinyin: string) => {
  if (typeof window === 'undefined') return;

  // 1. Ưu tiên audio gốc Prep cho vận mẫu đơn & kép cơ bản
  const prepUrl = PREP_AUDIO[pinyin];
  if (prepUrl) {
    const audio = new Audio(prepUrl);
    audio.play().catch(() => playByChar(pinyin));
    return;
  }

  // 2. Dùng chữ Hán → Google TTS zh-CN (chuẩn nhất)
  playByChar(pinyin);
};

const playByChar = (pinyin: string) => {
  const char = FINAL_CHAR[pinyin];
  if (!char) return;

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(char)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;
  const audio = new Audio(url);
  audio.play().catch(() => {
    // Fallback: Web Speech API
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang === 'zh-CN' && v.name.includes('Google')) || 
                    voices.find(v => v.lang.startsWith('zh'));
    
    if (!zhVoice) return;
    window.speechSynthesis.cancel();
    const utt = new window.SpeechSynthesisUtterance(char);
    utt.voice = zhVoice;
    utt.lang = 'zh-CN';
    utt.rate = 0.8;
    window.speechSynthesis.speak(utt);
  });
};

export default function FinalsTable() {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>36 Vận Mẫu (Nguyên âm)</h2>
      <p className={styles.subtitle}>Phát âm chuẩn người Trung &rarr; Cách đọc &rarr; Hướng dẫn</p>

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


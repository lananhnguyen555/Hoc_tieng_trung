"use client";

import React from 'react';
import styles from './phonetics.module.css';
import { Volume2 } from 'lucide-react';

const AUDIO_MAP: Record<string, string> = {
  // Initials (Prep.vn Standard Human Audio)
  'b': 'https://static-assets.prepcdn.com/content-management-system/b_84703e4ca6.mp3',
  'p': 'https://static-assets.prepcdn.com/content-management-system/p_a8df5cf1d6.mp3',
  'm': 'https://static-assets.prepcdn.com/content-management-system/m_3e4f224748.mp3',
  'f': 'https://static-assets.prepcdn.com/content-management-system/f_1240bc7c64.mp3',
  'd': 'https://static-assets.prepcdn.com/content-management-system/d_cd820e5305.mp3',
  't': 'https://static-assets.prepcdn.com/content-management-system/t_d0a7cb3858.mp3',
  'n': 'https://static-assets.prepcdn.com/content-management-system/n_15945ec0ce.mp3',
  'l': 'https://static-assets.prepcdn.com/content-management-system/l_7f0d089ff7.mp3',
  'g': 'https://static-assets.prepcdn.com/content-management-system/g_dcbddbf7d5.mp3',
  'k': 'https://static-assets.prepcdn.com/content-management-system/k_fe2d7365c2.mp3',
  'h': 'https://static-assets.prepcdn.com/content-management-system/h_2e4b29149f.mp3',
  'j': 'https://static-assets.prepcdn.com/content-management-system/j_b1fdc8d33c.mp3',
  'q': 'https://static-assets.prepcdn.com/content-management-system/q_46c0cc6508.mp3',
  'x': 'https://static-assets.prepcdn.com/content-management-system/x_fe06e4db0b.mp3',
  'z': 'https://static-assets.prepcdn.com/content-management-system/z_9d28a4d670.mp3',
  'c': 'https://static-assets.prepcdn.com/content-management-system/c_8679305075.mp3',
  's': 'https://static-assets.prepcdn.com/content-management-system/s_21e1dcfddc.mp3',
  'zh': 'https://static-assets.prepcdn.com/content-management-system/zh_5a3aeeff6b.mp3',
  'ch': 'https://static-assets.prepcdn.com/content-management-system/ch_03c333af76.mp3',
  'sh': 'https://static-assets.prepcdn.com/content-management-system/sh_9ac3105d2f.mp3',
  'r': 'https://static-assets.prepcdn.com/content-management-system/r_b3c80234ce.mp3'
};

const INITIAL_GROUPS = [
  {
    name: "Âm hai môi + âm môi răng",
    items: [
      { pinyin: 'b', combination: 'b + o', sound: 'pua', instruction: 'Mím môi rồi bật hơi nhẹ nhàng.' },
      { pinyin: 'p', combination: 'p + o', sound: 'pua (bật hơi)', instruction: 'Mím môi rồi bật hơi thật mạnh.' },
      { pinyin: 'm', combination: 'm + o', sound: 'mua', instruction: 'Mím môi nhẹ nhàng, âm đi qua mũi.' },
      { pinyin: 'f', combination: 'f + o', sound: 'phua', instruction: 'Răng trên chạm nhẹ môi dưới.' },
    ]
  },
  {
    name: "Âm đầu lưỡi",
    items: [
      { pinyin: 'd', combination: 'd + e', sound: 'tưa', instruction: 'Đầu lưỡi chạm vào lợi hàm trên.' },
      { pinyin: 't', combination: 't + e', sound: 'thưa (bật hơi)', instruction: 'Đầu lưỡi chạm lợi, bật hơi mạnh.' },
      { pinyin: 'n', combination: 'n + e', sound: 'nưa', instruction: 'Âm đi qua mũi, đầu lưỡi chạm lợi.' },
      { pinyin: 'l', combination: 'l + e', sound: 'lưa', instruction: 'Đầu lưỡi hạ thấp, âm đi hai bên.' },
    ]
  },
  {
    name: "Âm gốc lưỡi",
    items: [
      { pinyin: 'g', combination: 'g + e', sound: 'cưa', instruction: 'Gốc lưỡi nâng cao chạm vòm họng.' },
      { pinyin: 'k', combination: 'k + e', sound: 'khưa (bật hơi)', instruction: 'Gốc lưỡi nâng cao, bật hơi mạnh.' },
      { pinyin: 'h', combination: 'h + e', sound: 'khưa', instruction: 'Lưỡi thả lỏng, đẩy hơi nhẹ nhàng.' },
    ]
  },
  {
    name: "Âm mặt lưỡi",
    items: [
      { pinyin: 'j', combination: 'j + i', sound: 'chi', instruction: 'Mặt lưỡi phẳng, nhè nhẹ đẩy hơi.' },
      { pinyin: 'q', combination: 'q + i', sound: 'chi (bật hơi)', instruction: 'Mặt lưỡi phẳng, bật hơi thật mạnh.' },
      { pinyin: 'x', combination: 'x + i', sound: 'xi', instruction: 'Mặt lưỡi phẳng, đẩy hơi qua khe hẹp.' },
    ]
  },
  {
    name: "Âm lưỡi trước",
    items: [
      { pinyin: 'z', combination: 'z + i', sound: 'chư (dứt khoát)', instruction: 'Đầu lưỡi chạm mặt sau răng trên.' },
      { pinyin: 'c', combination: 'c + i', sound: 'chư (bật hơi)', instruction: 'Đầu lưỡi chạm răng trên, bật hơi mạnh.' },
      { pinyin: 's', combination: 's + i', sound: 'xư', instruction: 'Đầu lưỡi gần răng trên, đẩy hơi nhẹ.' },
    ]
  },
  {
    name: "Âm lưỡi sau",
    items: [
      { pinyin: 'zh', combination: 'zh + i', sound: 'trư', instruction: 'Uốn lưỡi chạm vòm họng cứng.' },
      { pinyin: 'ch', combination: 'ch + i', sound: 'trư (bật hơi)', instruction: 'Uốn lưỡi chạm vòm, bật hơi mạnh.' },
      { pinyin: 'sh', combination: 'sh + i', sound: 'sư', instruction: 'Uốn lưỡi gần vòm họng, đẩy hơi.' },
      { pinyin: 'r', combination: 'r + i', sound: 'rư', instruction: 'Uốn lưỡi, không rung dây thanh quản.' },
    ]
  }
];

export default function InitialsTable() {
  const playAudio = (pinyin: string) => {
    if (typeof window === 'undefined') return;
    
    // Using direct human audio URLs extracted from PrepEdu.vn
    const audioUrl = AUDIO_MAP[pinyin];
    
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    } else {
      // Fallback to high-quality Google TTS if specific URL is missing
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(pinyin)}&tl=zh-CN&client=tw-ob`;
      new Audio(ttsUrl).play().catch(console.error);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>21 Thanh Mẫu (Phụ âm đầu)</h2>
      <p className={styles.subtitle}>Phát âm chuẩn Prep &rarr; Kết hợp &rarr; Cách đọc</p>
      
      <div className={styles.tableWrapper}>
        <table className={styles.pinyinTable}>
          <thead>
            <tr>
              <th>Thanh mẫu</th>
              <th>Nghe âm</th>
              <th>Kết hợp Pinyin</th>
              <th>Cách đọc (Gần giống)</th>
              <th>Hướng dẫn phát âm</th>
            </tr>
          </thead>
          <tbody>
            {INITIAL_GROUPS.map((group) => (
              <React.Fragment key={group.name}>
                <tr className={styles.groupRow}>
                  <td colSpan={5}>{group.name}</td>
                </tr>
                {group.items.map((item) => (
                  <tr key={item.pinyin} className={styles.dataRow}>
                    <td className={styles.pinyinCell}>{item.pinyin}</td>
                    <td>
                      <button className={styles.playBtn} onClick={() => playAudio(item.pinyin)}>
                        <Volume2 size={20} />
                      </button>
                    </td>
                    <td className={styles.combinationCell}>{item.combination}</td>
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

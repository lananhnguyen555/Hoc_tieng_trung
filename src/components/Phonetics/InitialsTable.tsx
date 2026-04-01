"use client";

import React from 'react';
import styles from './phonetics.module.css';
import { Volume2 } from 'lucide-react';


const INITIAL_GROUPS = [
  {
    name: "Âm hai môi + âm môi răng",
    items: [
      { pinyin: 'b', combination: 'b + o', sound: 'pua', speak: 'bo', instruction: 'Mím môi rồi bật hơi nhẹ nhàng.' },
      { pinyin: 'p', combination: 'p + o', sound: 'pua (bật hơi)', speak: 'po', instruction: 'Mím môi rồi bật hơi thật mạnh.' },
      { pinyin: 'm', combination: 'm + o', sound: 'mua', speak: 'mo', instruction: 'Mím môi nhẹ nhàng, âm đi qua mũi.' },
      { pinyin: 'f', combination: 'f + o', sound: 'phua', speak: 'fo', instruction: 'Răng trên chạm nhẹ môi dưới.' },
    ]
  },
  {
    name: "Âm đầu lưỡi",
    items: [
      { pinyin: 'd', combination: 'd + e', sound: 'tưa', speak: 'de', instruction: 'Đầu lưỡi chạm vào lợi hàm trên.' },
      { pinyin: 't', combination: 't + e', sound: 'thưa (bật hơi)', speak: 'te', instruction: 'Đầu lưỡi chạm lợi, bật hơi mạnh.' },
      { pinyin: 'n', combination: 'n + e', sound: 'nưa', speak: 'ne', instruction: 'Âm đi qua mũi, đầu lưỡi chạm lợi.' },
      { pinyin: 'l', combination: 'l + e', sound: 'lưa', speak: 'le', instruction: 'Đầu lưỡi hạ thấp, âm đi hai bên.' },
    ]
  },
  {
    name: "Âm gốc lưỡi",
    items: [
      { pinyin: 'g', combination: 'g + e', sound: 'cưa', speak: 'ge', instruction: 'Gốc lưỡi nâng cao chạm vòm họng.' },
      { pinyin: 'k', combination: 'k + e', sound: 'khưa (bật hơi)', speak: 'ke', instruction: 'Gốc lưỡi nâng cao, bật hơi mạnh.' },
      { pinyin: 'h', combination: 'h + e', sound: 'khưa', speak: 'he', instruction: 'Lưỡi thả lỏng, đẩy hơi nhẹ nhàng.' },
    ]
  },
  {
    name: "Âm mặt lưỡi",
    items: [
      { pinyin: 'j', combination: 'j + i', sound: 'chi', speak: 'ji', instruction: 'Mặt lưỡi phẳng, nhè nhẹ đẩy hơi.' },
      { pinyin: 'q', combination: 'q + i', sound: 'chi (bật hơi)', speak: 'qi', instruction: 'Mặt lưỡi phẳng, bật hơi thật mạnh.' },
      { pinyin: 'x', combination: 'x + i', sound: 'xi', speak: 'xi', instruction: 'Mặt lưỡi phẳng, đẩy hơi qua khe hẹp.' },
    ]
  },
  {
    name: "Âm lưỡi trước",
    items: [
      { pinyin: 'z', combination: 'z + i', sound: 'chư (dứt khoát)', speak: 'zi', instruction: 'Đầu lưỡi chạm mặt sau răng trên.' },
      { pinyin: 'c', combination: 'c + i', sound: 'chư (bật hơi)', speak: 'ci', instruction: 'Đầu lưỡi chạm răng trên, bật hơi mạnh.' },
      { pinyin: 's', combination: 's + i', sound: 'xư', speak: 'si', instruction: 'Đầu lưỡi gần răng trên, đẩy hơi nhẹ.' },
    ]
  },
  {
    name: "Âm lưỡi sau",
    items: [
      { pinyin: 'zh', combination: 'zh + i', sound: 'trư', speak: 'zhi', instruction: 'Uốn lưỡi chạm vòm họng cứng.' },
      { pinyin: 'ch', combination: 'ch + i', sound: 'trư (bật hơi)', speak: 'chi', instruction: 'Uốn lưỡi chạm vòm, bật hơi mạnh.' },
      { pinyin: 'sh', combination: 'sh + i', sound: 'sư', speak: 'shi', instruction: 'Uốn lưỡi gần vòm họng, đẩy hơi.' },
      { pinyin: 'r', combination: 'r + i', sound: 'rư', speak: 'ri', instruction: 'Uốn lưỡi, không rung dây thanh quản.' },
    ]
  }
];

export default function InitialsTable() {
  const playAudio = (text: string) => {
    if (typeof window === 'undefined') return;
    
    // Using a more robust human-sounding audio source (Yoyochinese or Google TTS Fallback)
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
      <h2 className={styles.sectionTitle}>21 Thanh Mẫu (Phụ âm đầu)</h2>
      <p className={styles.subtitle}>Phát âm chuẩn theo trình tự: Thanh mẫu &rarr; Kết hợp &rarr; Cách đọc</p>
      
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
                      <button className={styles.playBtn} onClick={() => playAudio(item.speak)}>
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

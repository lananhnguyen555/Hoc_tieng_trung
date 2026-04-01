"use client";

import React, { useState } from 'react';
import styles from './phonetics.module.css';
import { Volume2, Info, X } from 'lucide-react';

interface FinalItem {
  pinyin: string;
  description: string;
  group: string;
}

const FINALS: FinalItem[] = [
  // Vận mẫu đơn
  { pinyin: 'a', description: "Phát âm như 'a' trong tiếng Việt.", group: "Vận mẫu đơn" },
  { pinyin: 'o', description: "Phát âm gần như 'ô' trong tiếng Việt.", group: "Vận mẫu đơn" },
  { pinyin: 'e', description: "Phát âm gần như 'ưa' (hoặc 'ơ') trong tiếng Việt.", group: "Vận mẫu đơn" },
  { pinyin: 'i', description: "Phát âm như 'i' trong tiếng Việt.", group: "Vận mẫu đơn" },
  { pinyin: 'u', description: "Phát âm như 'u' trong tiếng Việt.", group: "Vận mẫu đơn" },
  { pinyin: 'ü', description: "Phát âm như 'uy' nhưng môi giữ tròn (giống âm 'u' nhưng lưỡi ở vị trí 'i').", group: "Vận mẫu đơn" },
  
  // Vận mẫu kép
  { pinyin: 'ai', description: "Đọc như 'ai' (kéo dài âm a rồi lướt sang i).", group: "Vận mẫu kép" },
  { pinyin: 'ei', description: "Đọc như 'ây' trong bộ gõ tiếng Việt.", group: "Vận mẫu kép" },
  { pinyin: 'ui', description: "Viết tắt của 'uei', đọc là 'uây'.", group: "Vận mẫu kép" },
  { pinyin: 'ao', description: "Đọc như 'ao' trong tiếng Việt.", group: "Vận mẫu kép" },
  { pinyin: 'ou', description: "Đọc như 'âu' trong tiếng Việt.", group: "Vận mẫu kép" },
  { pinyin: 'iu', description: "Viết tắt của 'iou', đọc như 'iêu'.", group: "Vận mẫu kép" },
  { pinyin: 'ie', description: "Đọc như 'iê' hoặc 'i-ê'.", group: "Vận mẫu kép" },
  { pinyin: 'üe', description: "Đọc như 'uê' với môi tròn.", group: "Vận mẫu kép" },
  { pinyin: 'er', description: "Âm cong lưỡi. Đọc như 'ơ' rồi uốn lưỡi lên.", group: "Vận mẫu kép" },
  
  // Vận mẫu mũi
  { pinyin: 'an', description: "Đọc như 'an' trong tiếng Việt.", group: "Vận mẫu mũi" },
  { pinyin: 'en', description: "Đọc như 'ân' trong tiếng Việt.", group: "Vận mẫu mũi" },
  { pinyin: 'in', description: "Đọc như 'in' trong tiếng Việt.", group: "Vận mẫu mũi" },
  { pinyin: 'un', description: "Viết tắt của 'uen', đọc là 'uân'.", group: "Vận mẫu mũi" },
  { pinyin: 'ün', description: "Đọc là 'uyn' với môi tròn.", group: "Vận mẫu mũi" },
  { pinyin: 'ang', description: "Đọc như 'ang' trong tiếng Việt.", group: "Vận mẫu mũi" },
  { pinyin: 'eng', description: "Đọc như 'âng' trong tiếng Việt.", group: "Vận mẫu mũi" },
  { pinyin: 'ing', description: "Đọc như 'ing' trong tiếng Việt.", group: "Vận mẫu mũi" },
  { pinyin: 'ong', description: "Đọc như 'ung' nhưng có độ vang.", group: "Vận mẫu mũi" },

  // Vận mẫu phức khác
  { pinyin: 'ia', description: "Đọc như 'ia'.", group: "Vận mẫu phức" },
  { pinyin: 'iao', description: "Đọc như 'iao' (i + ao).", group: "Vận mẫu phức" },
  { pinyin: 'ian', description: "Đọc như 'i-en' (nghe gần giống iên).", group: "Vận mẫu phức" },
  { pinyin: 'iang', description: "Đọc như 'i-ang'.", group: "Vận mẫu phức" },
  { pinyin: 'iong', description: "Đọc như 'i-ung'.", group: "Vận mẫu phức" },
  { pinyin: 'ua', description: "Đọc như 'oa'.", group: "Vận mẫu phức" },
  { pinyin: 'uo', description: "Đọc như 'u-ô' (nghe gần giống ua).", group: "Vận mẫu phức" },
  { pinyin: 'uai', description: "Đọc như 'uai'.", group: "Vận mẫu phức" },
  { pinyin: 'uan', description: "Đọc như 'oan'.", group: "Vận mẫu phức" },
  { pinyin: 'uang', description: "Đọc như 'oang'.", group: "Vận mẫu phức" },
  { pinyin: 'ueng', description: "Đọc như 'u-âng'.", group: "Vận mẫu phức" },
  { pinyin: 'üan', description: "Đọc như 'uên'.", group: "Vận mẫu phức" },
];

export default function FinalsTable() {
  const [selectedFinal, setSelectedFinal] = useState<FinalItem | null>(null);

  const playAudio = (text: string) => {
    if (typeof window === 'undefined') return;
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=tw-ob`;
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    });
  };

  const groups = Array.from(new Set(FINALS.map(f => f.group)));

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>36 Vận Mẫu (Nguyên âm)</h2>
      
      <div className={styles.finalsWrapper}>
        {groups.map(group => (
          <div key={group} className={styles.finalGroupBlock}>
            <h3 className={styles.finalGroupName}>{group}</h3>
            <div className={styles.finalsGrid}>
              {FINALS.filter(f => f.group === group).map((item) => (
                <div 
                  key={item.pinyin} 
                  className={styles.finalTag} 
                  onClick={() => playAudio(item.pinyin)}
                >
                  <span className={styles.finalText}>{item.pinyin}</span>
                  <button 
                    className={styles.finalInfoBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFinal(item);
                    }}
                  >
                    <Info size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Final Details */}
      {selectedFinal && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFinal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedFinal(null)}>
              <X size={24} />
            </button>
            <div className={styles.modalHeader}>
              <span className={styles.modalPinyin}>{selectedFinal.pinyin}</span>
              <button className={styles.modalSpeakBtn} onClick={() => playAudio(selectedFinal.pinyin)}>
                <Volume2 size={24} /> Nghe phát âm
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalRow}>
                <strong>Phân loại:</strong>
                <span>{selectedFinal.group}</span>
              </div>
              <div className={styles.modalRow}>
                <strong>Hướng dẫn:</strong>
                <p className={styles.instructionText}>{selectedFinal.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Volume2, CheckCircle2, XCircle, RotateCcw, ChevronRight, Play } from "lucide-react";
import styles from "./listening.module.css";

const MOCK_WORDS = [
  { id: 1, word: "学习", pinyin: "xuéxí", meaning: "Học tập" },
  { id: 2, word: "老师", pinyin: "lǎoshī", meaning: "Giáo viên" },
  { id: 3, word: "学生", pinyin: "xuésheng", meaning: "Học sinh" },
];

export default function ListeningPage() {
  const [step, setStep] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);

  const current = MOCK_WORDS[step];
  // Generate random options (including the correct one)
  const options = MOCK_WORDS.map(w => w.word);

  const playAudio = async () => {
    setAudioLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        body: JSON.stringify({ text: current.word }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error(err);
      alert("Hãy cấu hình OPENAI_API_KEY để sử dụng tính năng này.");
    } finally {
      setAudioLoading(false);
    }
  };

  const handleOptionClick = (word: string) => {
    if (selectedWord) return;
    setSelectedWord(word);
    setIsCorrect(word === current.word);
  };

  const nextStep = () => {
    if (step < MOCK_WORDS.length - 1) {
      setStep(step + 1);
      setSelectedWord(null);
      setIsCorrect(null);
    } else {
      alert("Chúc mừng! Bạn đã hoàn thành phần nghe.");
      setStep(0);
      setSelectedWord(null);
      setIsCorrect(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Luyện nghe</h1>
        <p className={styles.subtitle}>Nghe và chọn từ Hán tự tương ứng.</p>
      </header>

      <div className={styles.studyArea}>
        <button 
          className={`card ${styles.audioCard} ${audioLoading ? styles.loading : ""}`} 
          onClick={playAudio}
          disabled={audioLoading}
        >
          <Volume2 size={64} />
          <span>{audioLoading ? "Đang tải..." : "Bấm để nghe"}</span>
        </button>

        <div className={styles.optionsGrid}>
          {options.map((option) => (
            <button
              key={option}
              className={`card ${styles.optionBtn} ${
                selectedWord === option
                  ? option === current.word
                    ? styles.correct
                    : styles.wrong
                  : selectedWord && option === current.word
                  ? styles.correctIndicator
                  : ""
              }`}
              onClick={() => handleOptionClick(option)}
              disabled={!!selectedWord}
            >
              <span className={styles.hanzi}>{option}</span>
              {selectedWord === option && (
                <div className={styles.feedbackIcon}>
                  {option === current.word ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
              )}
            </button>
          ))}
        </div>

        {selectedWord && (
          <button className={`btn-primary ${styles.nextBtn}`} onClick={nextStep}>
            {step < MOCK_WORDS.length - 1 ? "Câu tiếp theo" : "Hoàn thành"} <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

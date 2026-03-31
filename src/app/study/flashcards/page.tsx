"use client";

import { useState, useEffect } from "react";
import Flashcard from "@/components/Flashcard";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import styles from "./flashcards.module.css";

const MOCK_VOCAB = [
  { id: "1", word: "学习", pinyin: "xuéxí", meaning: "Học tập", lesson_id: "mock" },
  { id: "2", word: "老师", pinyin: "lǎoshī", meaning: "Giáo viên", lesson_id: "mock" },
  { id: "3", word: "学生", pinyin: "xuésheng", meaning: "Học sinh", lesson_id: "mock" },
];

export default function FlashcardStudyPage() {
  const [allVocab, setAllVocab] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Load everything
    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
    
    // We'd ideally fetch from Supabase here too, but for simplicity:
    setAllVocab([...MOCK_VOCAB, ...localVocab]);
    setLessons([{id: "mock", name: "Dữ liệu mẫu"}, ...localLessons]);
  }, []);

  const filteredVocab = allVocab.filter(v => selectedLessonId === "all" || v.lesson_id === selectedLessonId);
  const current = filteredVocab[currentIndex];

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredVocab.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredVocab.length) % filteredVocab.length);
  };

  const reset = () => {
    setCurrentIndex(0);
  };

  if (filteredVocab.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Flashcards</h1>
          <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.lessonSelect}>
            <option value="all">Tất cả bài học</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className={styles.empty}>Chưa có từ vựng trong buổi này!</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Flashcards</h1>
        <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.lessonSelect}>
          <option value="all">Tất cả bài học</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <header className={styles.header}>
        <h1 className={styles.title}>Flashcards Ôn tập</h1>
        <p className={styles.subtitle}>Vuốt hoặc click để lật thẻ và kiểm tra kiến thức.</p>
      </header>

      <div className={styles.studyArea}>
        <div className={styles.progress}>
          Thẻ {currentIndex + 1} / {filteredVocab.length}
        </div>
        
        <Flashcard 
          key={current.id} 
          word={current.word} 
          pinyin={current.pinyin} 
          meaning={current.meaning} 
        />

        <div className={styles.controls}>
          <button className={styles.controlBtn} onClick={prevCard}>
            <ChevronLeft size={24} />
          </button>
          <button className={styles.resetBtn} onClick={reset}>
            <RotateCcw size={20} />
          </button>
          <button className={styles.controlBtn} onClick={nextCard}>
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

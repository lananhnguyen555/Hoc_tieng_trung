"use client";

import { useState, useEffect, useCallback } from "react";
import { useVocabData, Word } from "@/hooks/useVocabData";
import { getProgress, updateProgress, sortByPriority, getLessonAvgScore, saveStudySession, isMastered, MASTERY_THRESHOLD_VALUE } from "@/lib/srs";
import { Volume2, ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle, Trophy, BookOpen } from "lucide-react";
import styles from "./flashcards.module.css";

type CardState = "front" | "back";

export default function FlashcardStudyPage() {
  const { vocab, lessons, loading } = useVocabData();
  const [selectedLessonId, setSelectedLessonId] = useState("all");
  const [cards, setCards] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>("front");
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [startTime] = useState(Date.now());
  const [sessionDone, setSessionDone] = useState(false);
  const [showSRS, setShowSRS] = useState(false);

  useEffect(() => {
    if (vocab.length === 0) return;
    const filtered = selectedLessonId === "all"
      ? vocab
      : vocab.filter(v => v.lesson_id === selectedLessonId);
    setCards(sortByPriority(filtered)); // Ưu tiên từ điểm thấp
    setCurrentIndex(0);
    setCardState("front");
    setSessionCorrect(0);
    setSessionTotal(0);
    setSessionDone(false);
  }, [vocab, selectedLessonId]);

  const current = cards[currentIndex];
  const avgScore = cards.length > 0 ? getLessonAvgScore(cards.map(c => c.id)) : 0;

  const speak = (text: string) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN"; u.rate = 0.8;
    window.speechSynthesis?.speak(u);
  };

  const flipCard = () => {
    setCardState(prev => prev === "front" ? "back" : "front");
    if (cardState === "front") speak(current.word);
  };

  const handleAnswer = async (correct: boolean) => {
    await updateProgress(current.id, correct);
    setSessionTotal(t => t + 1);
    if (correct) setSessionCorrect(c => c + 1);

    if (currentIndex + 1 >= cards.length) {
      // Kết thúc phiên
      const duration = Math.round((Date.now() - startTime) / 1000);
      await saveStudySession("flashcard", selectedLessonId, sessionCorrect + (correct ? 1 : 0), cards.length, duration);
      setSessionDone(true);
    } else {
      setCurrentIndex(i => i + 1);
      setCardState("front");
    }
  };

  const restart = () => {
    const filtered = selectedLessonId === "all" ? vocab : vocab.filter(v => v.lesson_id === selectedLessonId);
    setCards(sortByPriority(filtered));
    setCurrentIndex(0);
    setCardState("front");
    setSessionCorrect(0);
    setSessionTotal(0);
    setSessionDone(false);
  };

  const progressPercent = cards.length > 0 ? Math.round((currentIndex / cards.length) * 100) : 0;

  if (loading) return <div className={styles.container}><div className={styles.empty}>Đang tải từ vựng...</div></div>;

  if (cards.length === 0) return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🗃️ Flashcard Ôn tập</h1>
        <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.lessonSelect}>
          <option value="all">Tất cả bài học</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </header>
      <div className={styles.empty}><BookOpen size={48} style={{opacity:0.2, marginBottom:'1rem'}} /><p>Chưa có từ vựng. Hãy chọn buổi học!</p></div>
    </div>
  );

  if (sessionDone) {
    const pct = Math.round((sessionCorrect / sessionTotal) * 100);
    const mastered = cards.filter(c => isMastered(c.id)).length;
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>{pct >= 85 ? "🏆" : pct >= 60 ? "👍" : "💪"}</div>
          <h2>Xong phiên học!</h2>
          <div className={styles.resultScore} style={{color: pct >= 85 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444"}}>
            {pct}%
          </div>
          <p>{sessionCorrect}/{sessionTotal} câu đúng</p>
          <div className={styles.masteryBar}>
            <div className={styles.masteryLabel}>Thành thạo ({mastered}/{cards.length} từ đạt &gt;{MASTERY_THRESHOLD_VALUE}%)</div>
            <div className={styles.barTrack}><div className={styles.barFill} style={{width:`${Math.round(mastered/cards.length*100)}%`}} /></div>
          </div>
          {pct >= 85 && <div className={styles.successBanner}><Trophy size={20}/> Xuất sắc! Bạn đã thành thạo buổi này!</div>}
          <div className={styles.resultActions}>
            <button className={styles.restartBtn} onClick={restart}><RotateCcw size={18}/> Học lại</button>
            <button className={styles.weakBtn} onClick={() => { setCards(sortByPriority(cards).filter(c => !isMastered(c.id))); setCurrentIndex(0); setCardState("front"); setSessionDone(false); setSessionCorrect(0); setSessionTotal(0); }}>
              Ôn từ yếu thôi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const prog = getProgress(current.id);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🗃️ Flashcard Ôn tập</h1>
        <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.lessonSelect}>
          <option value="all">Tất cả bài học</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </header>

      {/* Progress bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>Thẻ {currentIndex + 1}/{cards.length}</span>
          <span style={{color:'#22c55e', fontWeight:700}}>Trung bình: {avgScore}%</span>
        </div>
        <div className={styles.barTrack}><div className={styles.barFill} style={{width:`${progressPercent}%`}} /></div>
      </div>

      {/* Card */}
      <div className={`${styles.card} ${cardState === "back" ? styles.flipped : ""}`} onClick={flipCard}>
        <div className={styles.cardInner}>
          <div className={styles.cardFront}>
            <p className={styles.lessonTag}>{current.lesson || "Từ vựng"}</p>
            <div className={styles.hanzi}>{current.word}</div>
            <p className={styles.hint}>Nhấn để lật xem nghĩa</p>
            {/* SRS score badge */}
            <div className={`${styles.scoreBadge} ${prog.score >= 85 ? styles.mastered : prog.score >= 50 ? styles.medium : styles.weak}`}>
              {prog.score}%
            </div>
          </div>
          <div className={styles.cardBack}>
            <div className={styles.pinyin}>{current.pinyin}</div>
            <div className={styles.meaning}>{current.meaning}</div>
            {current.word_type && <span className={styles.wordType}>{current.word_type}</span>}
            <button className={styles.speakBtn} onClick={e => { e.stopPropagation(); speak(current.word); }}><Volume2 size={22}/></button>
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      {cardState === "back" && (
        <div className={styles.answerBtns}>
          <button className={styles.wrongBtn} onClick={() => handleAnswer(false)}><XCircle size={22}/> Chưa biết</button>
          <button className={styles.correctBtn} onClick={() => handleAnswer(true)}><CheckCircle size={22}/> Biết rồi</button>
        </div>
      )}

      {cardState === "front" && (
        <div className={styles.navBtns}>
          <button className={styles.navBtn} onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}><ChevronLeft size={24}/></button>
          <button className={styles.navBtn} onClick={() => setCurrentIndex(i => Math.min(cards.length - 1, i + 1))}><ChevronRight size={24}/></button>
        </div>
      )}
    </div>
  );
}

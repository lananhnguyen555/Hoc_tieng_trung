"use client";

import { useState, useEffect, useCallback } from "react";
import { useVocabData, Word } from "@/hooks/useVocabData";
import { updateProgress, saveStudySession } from "@/lib/srs";
import { CheckCircle, XCircle, Mic, MicOff, Volume2, RotateCcw, Trophy } from "lucide-react";
import styles from "./quiz.module.css";

type QuizMode = "hanzi-to-meaning" | "meaning-to-hanzi" | "pinyin-to-hanzi";
type QuizItem = { word: Word; choices: string[]; correct: string };

function generateQuiz(vocab: Word[], mode: QuizMode, count = 10): QuizItem[] {
  const pool = [...vocab].sort(() => Math.random() - 0.5).slice(0, Math.max(count, 4));
  const items: QuizItem[] = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const word = pool[i];
    let correct: string;
    let getChoice: (w: Word) => string;
    if (mode === "hanzi-to-meaning") { correct = word.meaning; getChoice = w => w.meaning; }
    else if (mode === "meaning-to-hanzi") { correct = word.word; getChoice = w => w.word; }
    else { correct = word.word; getChoice = w => w.word; }
    const others = pool.filter((_, j) => j !== i).sort(() => Math.random() - 0.5).slice(0, 3).map(getChoice);
    const choices = [...new Set([correct, ...others])].sort(() => Math.random() - 0.5).slice(0, 4);
    if (!choices.includes(correct)) choices[0] = correct;
    items.push({ word, choices: choices.sort(() => Math.random() - 0.5), correct });
  }
  return items;
}

export default function QuizPage() {
  const { vocab, lessons, loading } = useVocabData();
  const [selectedLessonId, setSelectedLessonId] = useState("all");
  const [mode, setMode] = useState<QuizMode>("hanzi-to-meaning");
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const filteredVocab = selectedLessonId === "all" ? vocab : vocab.filter(v => v.lesson_id === selectedLessonId);

  const startQuiz = useCallback(() => {
    if (filteredVocab.length < 4) return;
    setQuizItems(generateQuiz(filteredVocab, mode));
    setCurrentIndex(0); setSelected(null); setScore(0); setDone(false);
  }, [filteredVocab, mode]);

  useEffect(() => { if (vocab.length > 0) startQuiz(); }, [vocab, selectedLessonId, mode]);

  // Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const r = new (window as any).webkitSpeechRecognition();
      r.lang = "zh-CN"; r.continuous = false; r.interimResults = false;
      r.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        handleSelect(text.trim());
        setListening(false);
      };
      r.onerror = () => setListening(false);
      r.onend = () => setListening(false);
      setRecognition(r);
    }
  }, []);

  const speak = (text: string) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN"; u.rate = 0.8;
    window.speechSynthesis?.speak(u);
  };

  const handleSelect = async (choice: string) => {
    if (selected !== null) return;
    const item = quizItems[currentIndex];
    const correct = choice === item.correct;
    setSelected(choice);
    await updateProgress(item.word.id, correct);
    if (correct) setScore(s => s + 1);

    setTimeout(async () => {
      if (currentIndex + 1 >= quizItems.length) {
        const dur = Math.round((Date.now() - startTime) / 1000);
        await saveStudySession("quiz", selectedLessonId, score + (correct ? 1 : 0), quizItems.length, dur);
        setDone(true);
      } else {
        setCurrentIndex(i => i + 1);
        setSelected(null);
      }
    }, 1000);
  };

  const toggleMic = () => {
    if (!recognition) return;
    if (listening) { recognition.stop(); setListening(false); }
    else { recognition.start(); setListening(true); }
  };

  if (loading) return <div className={styles.container}><div className={styles.empty}>Đang tải...</div></div>;
  if (filteredVocab.length < 4) return (
    <div className={styles.container}>
      <header className={styles.header}><h1>📝 Quiz Trắc nghiệm</h1></header>
      <div className={styles.empty}>Cần ít nhất 4 từ để tạo quiz. Hãy chọn buổi học khác!</div>
    </div>
  );

  if (done) {
    const pct = Math.round((score / quizItems.length) * 100);
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>{pct >= 85 ? "🏆" : pct >= 60 ? "👍" : "💪"}</div>
          <h2>Kết quả Quiz</h2>
          <div className={styles.resultScore} style={{color: pct >= 85 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444"}}>{pct}%</div>
          <p>{score}/{quizItems.length} câu đúng</p>
          {pct >= 85 && <div className={styles.successBanner}><Trophy size={18}/> Xuất sắc! Đạt ngưỡng thành thạo!</div>}
          {pct < 85 && <p style={{color:'#f59e0b', fontSize:'0.85rem'}}>Cần &gt;85% để đạt thành thạo. Cố lên! 💪</p>}
          <button className={styles.restartBtn} onClick={startQuiz}><RotateCcw size={18}/> Làm lại</button>
        </div>
      </div>
    );
  }

  const item = quizItems[currentIndex];
  const progressPct = Math.round((currentIndex / quizItems.length) * 100);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📝 Quiz Trắc nghiệm</h1>
        <div className={styles.controls}>
          <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.select}>
            <option value="all">Tất cả</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={mode} onChange={e => setMode(e.target.value as QuizMode)} className={styles.select}>
            <option value="hanzi-to-meaning">Hán tự → Nghĩa</option>
            <option value="meaning-to-hanzi">Nghĩa → Hán tự</option>
            <option value="pinyin-to-hanzi">Pinyin → Hán tự</option>
          </select>
        </div>
      </header>

      {/* Progress */}
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>Câu {currentIndex + 1}/{quizItems.length}</span>
          <span style={{color:'#22c55e', fontWeight:700}}>Đúng: {score}</span>
        </div>
        <div className={styles.barTrack}><div className={styles.barFill} style={{width:`${progressPct}%`}} /></div>
      </div>

      {/* Question */}
      <div className={styles.questionCard}>
        {mode === "hanzi-to-meaning" && (
          <div className={styles.questionContent}>
            <div className={styles.hanziQ}>{item.word.word}</div>
            <div className={styles.pinyinQ}>{item.word.pinyin}</div>
            <div className={styles.questionLabel}>Nghĩa của từ này là gì?</div>
          </div>
        )}
        {mode === "meaning-to-hanzi" && (
          <div className={styles.questionContent}>
            <div className={styles.meaningQ}>{item.word.meaning}</div>
            <div className={styles.questionLabel}>Hán tự nào tương ứng?</div>
          </div>
        )}
        {mode === "pinyin-to-hanzi" && (
          <div className={styles.questionContent}>
            <div className={styles.pinyinBig}>{item.word.pinyin}</div>
            <div className={styles.questionLabel}>Hán tự nào tương ứng?</div>
          </div>
        )}
        <div className={styles.questionTools}>
          <button className={styles.toolBtn} onClick={() => speak(item.word.word)} title="Nghe phát âm"><Volume2 size={18}/></button>
          {recognition && (
            <button className={`${styles.toolBtn} ${listening ? styles.listening : ""}`} onClick={toggleMic} title="Nói đáp án">
              {listening ? <MicOff size={18}/> : <Mic size={18}/>}
            </button>
          )}
        </div>
      </div>

      {/* Choices */}
      <div className={styles.choices}>
        {item.choices.map((choice, i) => {
          let cls = styles.choice;
          if (selected !== null) {
            if (choice === item.correct) cls = `${styles.choice} ${styles.correct}`;
            else if (choice === selected) cls = `${styles.choice} ${styles.wrong}`;
          }
          return (
            <button key={i} className={cls} onClick={() => handleSelect(choice)} disabled={selected !== null}>
              {selected !== null && choice === item.correct && <CheckCircle size={18}/>}
              {selected !== null && choice === selected && choice !== item.correct && <XCircle size={18}/>}
              {mode === "hanzi-to-meaning" ? choice : <span className="hanzi">{choice}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

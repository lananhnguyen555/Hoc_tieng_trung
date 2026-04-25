"use client";

import { useState, useEffect, useRef } from "react";
import { useVocabData, Word } from "@/hooks/useVocabData";
import { updateProgress, saveStudySession } from "@/lib/srs";
import { Volume2, CheckCircle, XCircle, RotateCcw, Trophy, Keyboard } from "lucide-react";
import styles from "./writing.module.css";

type WriteMode = "meaning-to-pinyin" | "meaning-to-hanzi" | "listen-to-pinyin";

export default function WritingPage() {
  const { vocab, lessons, loading } = useVocabData();
  const [selectedLessonId, setSelectedLessonId] = useState("all");
  const [mode, setMode] = useState<WriteMode>("meaning-to-pinyin");
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredVocab = selectedLessonId === "all" ? vocab : vocab.filter(v => v.lesson_id === selectedLessonId);

  const startTest = () => {
    const shuffled = [...filteredVocab].sort(() => Math.random() - 0.5).slice(0, 10);
    setQueue(shuffled); setIndex(0); setInput(""); setChecked(false);
    setCorrect(null); setScore(0); setDone(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => { if (vocab.length > 0) startTest(); }, [vocab, selectedLessonId, mode]);

  const speak = (text: string) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN"; u.rate = 0.8;
    window.speechSynthesis?.speak(u);
  };

  const getAnswer = (word: Word): string => {
    if (mode === "meaning-to-hanzi") return word.word;
    return word.pinyin.toLowerCase().replace(/\s/g, "");
  };

  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s/g, "");

  const handleCheck = async () => {
    if (checked || !queue[index]) return;
    const answer = getAnswer(queue[index]);
    const isCorrect = normalize(input) === normalize(answer);
    setCorrect(isCorrect);
    setChecked(true);
    await updateProgress(queue[index].id, isCorrect);
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNext = async () => {
    if (index + 1 >= queue.length) {
      const dur = Math.round((Date.now() - startTime) / 1000);
      await saveStudySession("writing", selectedLessonId, score + (correct ? 1 : 0), queue.length, dur);
      setDone(true);
    } else {
      setIndex(i => i + 1); setInput(""); setChecked(false); setCorrect(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { if (!checked) handleCheck(); else handleNext(); }
  };

  if (loading) return <div className={styles.container}><div className={styles.empty}>Đang tải...</div></div>;
  if (filteredVocab.length === 0) return (
    <div className={styles.container}>
      <header className={styles.header}><h1>✍️ Bài kiểm tra viết</h1></header>
      <div className={styles.empty}>Chưa có từ vựng trong buổi này!</div>
    </div>
  );

  if (done) {
    const pct = Math.round((score / queue.length) * 100);
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>{pct >= 85 ? "🏆" : pct >= 60 ? "👍" : "💪"}</div>
          <h2>Kết quả bài viết</h2>
          <div className={styles.resultScore} style={{color: pct >= 85 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444"}}>{pct}%</div>
          <p>{score}/{queue.length} câu đúng</p>
          {pct >= 85 && <div className={styles.successBanner}><Trophy size={18}/> Xuất sắc! Đạt ngưỡng thành thạo!</div>}
          <button className={styles.restartBtn} onClick={startTest}><RotateCcw size={18}/> Làm lại</button>
        </div>
      </div>
    );
  }

  const current = queue[index];
  const answer = current ? getAnswer(current) : "";
  const progressPct = queue.length > 0 ? Math.round((index / queue.length) * 100) : 0;

  // Highlight sai từng ký tự
  const renderDiff = () => {
    if (!checked || correct) return null;
    return (
      <div className={styles.diffRow}>
        <span className={styles.diffLabel}>Đáp án đúng:</span>
        <span className={styles.diffAnswer}>{answer}</span>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>✍️ Bài kiểm tra viết</h1>
        <div className={styles.controls}>
          <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.select}>
            <option value="all">Tất cả</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={mode} onChange={e => setMode(e.target.value as WriteMode)} className={styles.select}>
            <option value="meaning-to-pinyin">Nghĩa → Pinyin</option>
            <option value="meaning-to-hanzi">Nghĩa → Hán tự</option>
            <option value="listen-to-pinyin">Nghe → Pinyin</option>
          </select>
        </div>
      </header>

      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>Câu {index + 1}/{queue.length}</span>
          <span style={{color:'#22c55e', fontWeight:700}}>Đúng: {score}</span>
        </div>
        <div className={styles.barTrack}><div className={styles.barFill} style={{width:`${progressPct}%`}} /></div>
      </div>

      <div className={styles.questionCard}>
        {mode === "listen-to-pinyin" ? (
          <div className={styles.listenSection}>
            <button className={styles.bigSpeakBtn} onClick={() => speak(current.word)}><Volume2 size={36}/></button>
            <p>Nghe và nhập Pinyin</p>
          </div>
        ) : (
          <div className={styles.questionContent}>
            <div className={styles.meaningBig}>{current.meaning}</div>
            <div className={styles.questionLabel}>
              {mode === "meaning-to-pinyin" ? "Nhập Pinyin:" : "Nhập Hán tự:"}
            </div>
          </div>
        )}

        <div className={styles.inputWrapper}>
          <Keyboard size={18} className={styles.inputIcon}/>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.writeInput} ${checked ? (correct ? styles.inputCorrect : styles.inputWrong) : ""}`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "meaning-to-hanzi" ? "Nhập Hán tự..." : "Nhập Pinyin..."}
            disabled={checked}
          />
          {checked && (
            <span className={styles.inputStatus}>
              {correct ? <CheckCircle size={22} color="#22c55e"/> : <XCircle size={22} color="#ef4444"/>}
            </span>
          )}
        </div>

        {renderDiff()}

        {!checked ? (
          <button className={styles.checkBtn} onClick={handleCheck} disabled={!input.trim()}>Kiểm tra (Enter)</button>
        ) : (
          <button className={styles.nextBtn} onClick={handleNext}>
            {index + 1 >= queue.length ? "Xem kết quả" : "Tiếp theo (Enter)"}
          </button>
        )}
      </div>
    </div>
  );
}

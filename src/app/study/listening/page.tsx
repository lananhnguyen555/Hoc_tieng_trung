"use client";

import { useState, useEffect, useRef } from "react";
import { useVocabData, Word } from "@/hooks/useVocabData";
import { updateProgress, saveStudySession, getProgress } from "@/lib/srs";
import {
  Volume2, Mic, MicOff, RotateCcw, ChevronRight, Trophy,
  CheckCircle, XCircle, AlertCircle, BookOpen
} from "lucide-react";
import styles from "./listening.module.css";

type Phase = "listen" | "speak" | "result";

interface RoundResult {
  word: Word;
  spoken: string;
  score: number; // 0–100
  passed: boolean;
}

// So sánh phát âm: normalize cả 2, tính % ký tự khớp
function calcScore(spoken: string, target: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().trim()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, "")
      .replace(/\s+/g, " ");

  const s = normalize(spoken);
  const t = normalize(target);

  if (s === t) return 100;
  if (!s) return 0;

  // Tính điểm dựa trên ký tự chung
  let matches = 0;
  const sArr = s.split("");
  const tArr = [...t.split("")];
  for (const ch of sArr) {
    const idx = tArr.indexOf(ch);
    if (idx !== -1) { matches++; tArr.splice(idx, 1); }
  }
  return Math.round((matches / Math.max(s.length, t.length)) * 100);
}

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const color = score >= 85 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="55" y="55" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="22" fontWeight="800">{score}%</text>
    </svg>
  );
}

export default function ListeningPage() {
  const { vocab, lessons, loading } = useVocabData();
  const [selectedLessonId, setSelectedLessonId] = useState("all");
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("listen");
  const [listening, setListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [roundScore, setRoundScore] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [startTime] = useState(Date.now());
  const [recognition, setRecognition] = useState<any>(null);
  const [supportsSpeech, setSupportsSpeech] = useState(true);

  const filteredVocab = selectedLessonId === "all"
    ? vocab : vocab.filter(v => v.lesson_id === selectedLessonId);

  // Khởi tạo bài học
  useEffect(() => {
    if (filteredVocab.length > 0) {
      const shuffled = [...filteredVocab].sort(() => Math.random() - 0.5).slice(0, 10);
      setQueue(shuffled);
      setIndex(0); setPhase("listen"); setResults([]); setSessionDone(false);
    }
  }, [filteredVocab.length, selectedLessonId]);

  // Khởi tạo Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupportsSpeech(false); return; }

    const r = new SpeechRecognition();
    r.lang = "zh-CN";
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 3;

    r.onresult = async (e: any) => {
      // Lấy kết quả tốt nhất
      const transcript = e.results[0][0].transcript;
      setSpokenText(transcript);
      setListening(false);

      const current = queue[index];
      const score = calcScore(transcript, current.word);
      setRoundScore(score);
      setPhase("result");

      const passed = score >= 70;
      await updateProgress(current.id, passed);
      setResults(prev => [...prev, { word: current, spoken: transcript, score, passed }]);
    };

    r.onerror = (e: any) => {
      console.error("Speech error:", e);
      setListening(false);
      if (e.error === "no-speech") {
        setSpokenText("(Không nghe thấy giọng nói)");
        setRoundScore(0);
        setPhase("result");
        setResults(prev => [...prev, { word: queue[index], spoken: "", score: 0, passed: false }]);
      }
    };
    r.onend = () => setListening(false);
    setRecognition(r);
  }, [queue, index]);

  const speak = (word: string, slow = false) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "zh-CN"; u.rate = slow ? 0.5 : 0.8;
    window.speechSynthesis?.speak(u);
  };

  const startListening = () => {
    if (!recognition || listening) return;
    setSpokenText("");
    setListening(true);
    recognition.start();
  };

  const stopListening = () => {
    recognition?.stop();
    setListening(false);
  };

  const handleNext = async () => {
    if (index + 1 >= queue.length) {
      const dur = Math.round((Date.now() - startTime) / 1000);
      const totalScore = results.reduce((s, r) => s + r.score, 0);
      const avgScore = Math.round(totalScore / results.length);
      await saveStudySession("speaking", selectedLessonId, avgScore, 100, dur);
      setSessionDone(true);
    } else {
      setIndex(i => i + 1);
      setPhase("listen");
      setSpokenText("");
    }
  };

  const restart = () => {
    const shuffled = [...filteredVocab].sort(() => Math.random() - 0.5).slice(0, 10);
    setQueue(shuffled);
    setIndex(0); setPhase("listen");
    setSpokenText(""); setResults([]); setSessionDone(false);
  };

  if (loading) return <div className={styles.container}><div className={styles.empty}>Đang tải...</div></div>;

  if (!supportsSpeech) return (
    <div className={styles.container}>
      <header className={styles.header}><h1>🎤 Nghe & Nhắc lại</h1></header>
      <div className={styles.empty}>
        <AlertCircle size={48} style={{color:'#f59e0b', marginBottom:'1rem'}}/>
        <p>Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói.</p>
        <p style={{color:'#9ca3af', fontSize:'0.85rem'}}>Hãy dùng Chrome hoặc Edge để sử dụng tính năng này.</p>
      </div>
    </div>
  );

  if (filteredVocab.length === 0) return (
    <div className={styles.container}>
      <header className={styles.header}><h1>🎤 Nghe & Nhắc lại</h1>
        <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.select}>
          <option value="all">Tất cả</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </header>
      <div className={styles.empty}><BookOpen size={48} style={{opacity:0.2}}/><p>Chưa có từ vựng!</p></div>
    </div>
  );

  // Màn hình kết quả phiên
  if (sessionDone) {
    const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    const passed = results.filter(r => r.passed).length;
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultEmoji}>{avgScore >= 85 ? "🏆" : avgScore >= 60 ? "👍" : "💪"}</div>
          <h2>Kết quả phiên luyện</h2>
          <ScoreRing score={avgScore} />
          <p>{passed}/{results.length} từ phát âm đạt yêu cầu (&gt;70%)</p>
          {avgScore >= 85 && <div className={styles.successBanner}><Trophy size={18}/> Phát âm xuất sắc!</div>}

          <div className={styles.roundList}>
            {results.map((r, i) => (
              <div key={i} className={`${styles.roundRow} ${r.passed ? styles.rowPass : styles.rowFail}`}>
                <span className={`${styles.roundHanzi} hanzi`}>{r.word.word}</span>
                <span className={styles.roundSpoken}>"{r.spoken || "—"}"</span>
                <span className={`${styles.roundScore} ${r.passed ? styles.scoreGood : styles.scoreBad}`}>{r.score}%</span>
                {r.passed ? <CheckCircle size={16} color="#22c55e"/> : <XCircle size={16} color="#ef4444"/>}
              </div>
            ))}
          </div>

          <button className={styles.restartBtn} onClick={restart}><RotateCcw size={18}/> Luyện lại</button>
        </div>
      </div>
    );
  }

  const current = queue[index];
  const progressPct = Math.round((index / queue.length) * 100);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎤 Nghe & Nhắc lại</h1>
        <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.select}>
          <option value="all">Tất cả</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </header>

      {/* Progress */}
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>Từ {index + 1}/{queue.length}</span>
          <span style={{color:'#22c55e', fontWeight:700}}>
            {results.filter(r => r.passed).length} đạt / {results.length} đã thử
          </span>
        </div>
        <div className={styles.barTrack}><div className={styles.barFill} style={{width:`${progressPct}%`}} /></div>
      </div>

      {/* Main card */}
      <div className={styles.mainCard}>
        {/* Phase: Listen */}
        {phase === "listen" && (
          <div className={styles.listenPhase}>
            <p className={styles.phaseLabel}>👂 Bước 1: Nghe từ</p>
            <div className={styles.wordHint}>
              <span className={styles.lessonTag}>{current.lesson || "Từ vựng"}</span>
              <div className={styles.meaningDisplay}>{current.meaning}</div>
            </div>
            <button className={styles.bigPlayBtn} onClick={() => speak(current.word)}>
              <Volume2 size={40} />
              <span>Nghe từ</span>
            </button>
            <button className={styles.slowBtn} onClick={() => speak(current.word, true)}>
              🐌 Nghe chậm
            </button>
            <button className={styles.nextPhaseBtn} onClick={() => setPhase("speak")}>
              Bắt đầu nhắc lại <ChevronRight size={18}/>
            </button>
          </div>
        )}

        {/* Phase: Speak */}
        {phase === "speak" && (
          <div className={styles.speakPhase}>
            <p className={styles.phaseLabel}>🎤 Bước 2: Nhắc lại</p>
            <div className={styles.speakHint}>
              <div className={styles.meaningDisplay}>{current.meaning}</div>
              <div className={styles.pinyinHint}>{current.pinyin}</div>
            </div>

            <div className={styles.micArea}>
              {listening ? (
                <button className={`${styles.micBtn} ${styles.micActive}`} onClick={stopListening}>
                  <MicOff size={40}/>
                  <span>Đang nghe... (nhấn để dừng)</span>
                </button>
              ) : (
                <button className={styles.micBtn} onClick={startListening}>
                  <Mic size={40}/>
                  <span>Nhấn để nói</span>
                </button>
              )}
            </div>

            <button className={styles.listenAgainBtn} onClick={() => speak(current.word)}>
              <Volume2 size={16}/> Nghe lại
            </button>
            <button className={styles.skipBtn} onClick={() => { setPhase("result"); setRoundScore(0); setSpokenText("(Bỏ qua)"); setResults(prev => [...prev, { word: current, spoken: "", score: 0, passed: false }]); }}>
              Bỏ qua
            </button>
          </div>
        )}

        {/* Phase: Result */}
        {phase === "result" && (
          <div className={styles.resultPhase}>
            <p className={styles.phaseLabel}>📊 Kết quả</p>

            <div className={styles.scoreDisplay}>
              <ScoreRing score={roundScore} />
            </div>

            <div className={styles.compareBox}>
              <div className={styles.compareRow}>
                <span className={styles.compareLabel}>Đúng:</span>
                <span className={`${styles.compareValue} hanzi`}>{current.word}</span>
                <button className={styles.inlineSpeak} onClick={() => speak(current.word)}><Volume2 size={14}/></button>
              </div>
              <div className={styles.compareRow}>
                <span className={styles.compareLabel}>Bạn nói:</span>
                <span className={`${styles.compareValue} ${roundScore >= 70 ? styles.textGood : styles.textBad}`}>
                  {spokenText || "—"}
                </span>
              </div>
              <div className={styles.compareRow}>
                <span className={styles.compareLabel}>Pinyin:</span>
                <span className={styles.pinyinHint}>{current.pinyin}</span>
              </div>
            </div>

            {roundScore >= 85 && <div className={styles.scoreBanner} style={{background:'#f0fdf4', color:'#16a34a'}}>✅ Xuất sắc! Phát âm rất chính xác!</div>}
            {roundScore >= 70 && roundScore < 85 && <div className={styles.scoreBanner} style={{background:'#fef9c3', color:'#92400e'}}>👍 Khá tốt! Cần luyện thêm một chút.</div>}
            {roundScore < 70 && <div className={styles.scoreBanner} style={{background:'#fef2f2', color:'#dc2626'}}>💪 Hãy thử lại! Ngưỡng đạt là 70%.</div>}

            <div className={styles.resultActions}>
              {roundScore < 70 && (
                <button className={styles.retryBtn} onClick={() => { setPhase("speak"); setSpokenText(""); }}>
                  <RotateCcw size={16}/> Thử lại
                </button>
              )}
              <button className={styles.nextBtn} onClick={handleNext}>
                {index + 1 >= queue.length ? "Xem tổng kết" : "Từ tiếp theo"} <ChevronRight size={18}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

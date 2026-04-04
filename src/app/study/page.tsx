"use client";

import { useState, useEffect } from "react";
import { 
  Play, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Layers, 
  Ear, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  BookOpen,
  Filter
} from "lucide-react";
import styles from "./study.module.css";
import { supabase } from "@/lib/supabase";
import Flashcard from "@/components/Flashcard";
import { pinyin as getPinyin } from "pinyin-pro";

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  lesson_id: string;
}

type StudyMode = "hidden_rows" | "flashcards" | "quiz" | "listening";

export default function StudyPage() {
  const [activeMode, setActiveMode] = useState<StudyMode>("hidden_rows");
  const [vocab, setVocab] = useState<Word[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Hidden Rows state
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);

  // Flashcards/Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);

  // Listening Mode Inputs
  const [userInputs, setUserInputs] = useState({ word: "", meaning: "" });
  const [showResult, setShowResult] = useState(false);
  const [checkResult, setCheckResult] = useState<{ word: boolean, meaning: boolean } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      // Fetch Lessons
      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");

      // Fetch Vocab
      const { data: dbVocab } = await supabase.from("vocab").select("*");
      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");

      let finalVocab = [...(dbVocab || []), ...localVocab];
      setVocab(finalVocab);
      setLessons([...(dbLessons || []), ...localLessons]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVocab = selectedLessonId === "all" 
    ? vocab 
    : vocab.filter(v => v.lesson_id === selectedLessonId);

  const displayVocab = activeMode === "hidden_rows" 
    ? filteredVocab.slice(0, visibleCount) 
    : filteredVocab;

  const currentWord = filteredVocab[currentIndex];

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const toggleHiddenColumn = (col: string) => {
    setHiddenColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Trung tâm Ôn tập</h1>
        <p className={styles.subtitle}>Luyện tập và ghi nhớ từ vựng qua nhiều phương pháp khác nhau.</p>
      </header>

      {/* Control Panel */}
      <div className={styles.toolbar}>
        <div className={styles.filterSection}>
          <div className={styles.selectGroup}>
            <Filter size={18} />
            <select 
              className={styles.select} 
              value={selectedLessonId} 
              onChange={e => {
                setSelectedLessonId(e.target.value);
                setVisibleCount(5);
                setCurrentIndex(0);
              }}
            >
              <option value="all">Tất cả từ vựng</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.modeTabs}>
          <button 
            className={`${styles.tab} ${activeMode === "hidden_rows" ? styles.activeTab : ""}`}
            onClick={() => setActiveMode("hidden_rows")}
          >
            <EyeOff size={18} /> <span>Tự ôn tập (Ẩn cột)</span>
          </button>
          <button 
            className={`${styles.tab} ${activeMode === "flashcards" ? styles.activeTab : ""}`}
            onClick={() => setActiveMode("flashcards")}
          >
            <Layers size={18} /> <span>Flashcards</span>
          </button>
          <button 
            className={`${styles.tab} ${activeMode === "listening" ? styles.activeTab : ""}`}
            onClick={() => setActiveMode("listening")}
          >
            <Ear size={18} /> <span>Luyện nghe</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : filteredVocab.length === 0 ? (
        <div className={styles.empty}>Chưa có từ vựng nào để ôn tập.</div>
      ) : (
        <main className={styles.mainContent}>
          
          {/* MODE: HIDDEN ROWS */}
          {activeMode === "hidden_rows" && (
            <div className={styles.studySection}>
              <div className={styles.tableControls}>
                <p>Nhóm 5 từ: Đang hiển thị <b>{displayVocab.length}</b> / {filteredVocab.length} từ</p>
                <div className={styles.checkGroup}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={hiddenColumns.includes("pinyin")} onChange={() => toggleHiddenColumn("pinyin")} />
                    Ẩn Pinyin
                  </label>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={hiddenColumns.includes("meaning")} onChange={() => toggleHiddenColumn("meaning")} />
                    Ẩn Nghĩa Việt
                  </label>
                </div>
              </div>

              <div className={styles.studyTableWrapper}>
                <table className={styles.studyTable}>
                  <thead>
                    <tr>
                      <th style={{width: "60px"}}>STT</th>
                      <th>Hán tự</th>
                      <th>Pinyin</th>
                      <th>Nghĩa Việt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayVocab.map((item, idx) => (
                      <tr key={item.id}>
                        <td className={styles.stt}>{idx + 1}</td>
                        <td className="hanzi" style={{fontSize: "2.5rem"}}>{item.word}</td>
                        <td className={styles.cellContent}>
                          <span className={`${hiddenColumns.includes("pinyin") ? styles.blurred : ""}`}>
                            {item.pinyin}
                          </span>
                        </td>
                        <td className={styles.cellContent}>
                          <span className={`${hiddenColumns.includes("meaning") ? styles.blurred : ""}`}>
                            {item.meaning}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visibleCount < filteredVocab.length && (
                <button className={styles.loadMore} onClick={() => setVisibleCount(prev => prev + 5)}>
                  Hiện thêm 5 hàng tiếp theo <ChevronRight size={18} />
                </button>
              )}
              {visibleCount > 5 && (
                <button className={styles.resetBtn} onClick={() => setVisibleCount(5)}>
                  <RotateCcw size={18} /> Quay lại 5 hàng đầu
                </button>
              )}
            </div>
          )}

          {/* MODE: FLASHCARDS */}
          {activeMode === "flashcards" && (
            <div className={styles.flashcardContainer}>
              <Flashcard 
                word={currentWord.word} 
                pinyin={currentWord.pinyin} 
                meaning={currentWord.meaning} 
              />
              <div className={styles.navBtns}>
                <button 
                  disabled={currentIndex === 0} 
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className={styles.navBtn}
                >
                  <ChevronLeft size={24} /> Trước
                </button>
                <span className={styles.cardCounter}>{currentIndex + 1} / {filteredVocab.length}</span>
                <button 
                  disabled={currentIndex === filteredVocab.length - 1} 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className={styles.navBtn}
                >
                  Sau <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}

          {/* MODE: LISTENING */}
          {activeMode === "listening" && (
            <div className={styles.listeningContainer}>
              <div className={styles.listenCard}>
                <button className={styles.bigPlayBtn} onClick={() => speak(currentWord.word)} title="Nhấn để nghe">
                  <Play size={48} fill="white" />
                </button>
                <p className={styles.instruction}>Hãy nghe và nhập lại Hán tự & Nghĩa Việt</p>
                
                <div className={styles.quizForm}>
                  <div className={styles.inputBox}>
                    <label>Hán tự:</label>
                    <input 
                      type="text" 
                      className={`${styles.studyInput} hanzi`} 
                      placeholder="Nhập chữ Hán..."
                      value={userInputs.word}
                      onChange={e => setUserInputs({...userInputs, word: e.target.value})}
                      disabled={showResult}
                    />
                    {showResult && (
                      <span className={checkResult?.word ? styles.correct : styles.incorrect}>
                        {checkResult?.word ? "✓ Chính xác" : `✗ Sai (Đúng là: ${currentWord.word})`}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputBox}>
                    <label>Nghĩa Việt:</label>
                    <input 
                      type="text" 
                      className={styles.studyInput} 
                      placeholder="Nhập nghĩa tiếng Việt..."
                      value={userInputs.meaning}
                      onChange={e => setUserInputs({...userInputs, meaning: e.target.value})}
                      disabled={showResult}
                    />
                    {showResult && (
                      <span className={checkResult?.meaning ? styles.correct : styles.incorrect}>
                        {checkResult?.meaning ? "✓ Chính xác" : `✗ Sai (Đúng là: ${currentWord.meaning})`}
                      </span>
                    )}
                  </div>

                  {!showResult ? (
                    <button 
                      className={styles.checkBtn} 
                      onClick={() => {
                        const wordMatch = userInputs.word.trim() === currentWord.word.trim();
                        const meaningMatch = userInputs.meaning.trim().toLowerCase() === currentWord.meaning.trim().toLowerCase();
                        setCheckResult({ word: wordMatch, meaning: meaningMatch });
                        setShowResult(true);
                      }}
                    >
                      Kiểm tra đáp án
                    </button>
                  ) : (
                    <button 
                      className={styles.nextBtn}
                      onClick={() => {
                        if (currentIndex < filteredVocab.length - 1) {
                          setCurrentIndex(prev => prev + 1);
                          setUserInputs({ word: "", meaning: "" });
                          setShowResult(false);
                          setCheckResult(null);
                        } else {
                          alert("Chúc mừng! Bạn đã hoàn thành bài luyện nghe.");
                        }
                      }}
                    >
                      Tiếp theo <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.navBtns}>
                <button 
                  disabled={currentIndex === 0} 
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className={styles.navBtn}
                >
                  Câu trước
                </button>
                <button 
                  disabled={currentIndex === filteredVocab.length - 1} 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className={styles.navBtn}
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
}

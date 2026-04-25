"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useVocabData, Word } from "@/hooks/useVocabData";
import { Search, X, Volume2, Star } from "lucide-react";
import styles from "./QuickDict.module.css";

export default function QuickDict() {
  const { vocab, loading } = useVocabData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Word | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Phím tắt Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery("");
        setSelected(null);
      }
      if (e.key === "Escape") { setOpen(false); setSelected(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const results = query.trim().length > 0
    ? vocab.filter(v =>
        v.word.includes(query) ||
        v.pinyin.toLowerCase().includes(query.toLowerCase()) ||
        v.meaning.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12)
    : [];

  const speak = (text: string) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = "zh-CN"; u.rate = 0.8;
    window.speechSynthesis?.speak(u);
  };

  const toggleStar = (wordId: string) => {
    const starred: string[] = JSON.parse(localStorage.getItem("starred_words") || "[]");
    const idx = starred.indexOf(wordId);
    if (idx >= 0) starred.splice(idx, 1); else starred.push(wordId);
    localStorage.setItem("starred_words", JSON.stringify(starred));
  };

  const isStarred = (wordId: string) => {
    try { return JSON.parse(localStorage.getItem("starred_words") || "[]").includes(wordId); } catch { return false; }
  };

  if (!open) return (
    <button className={styles.trigger} onClick={() => setOpen(true)} title="Tra từ nhanh (Ctrl+K)">
      <Search size={18}/> <span>Tra từ</span> <kbd>Ctrl+K</kbd>
    </button>
  );

  return (
    <div className={styles.overlay} onClick={() => { setOpen(false); setSelected(null); }}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon}/>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Nhập Hán tự, Pinyin hoặc Nghĩa..."
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); }}
          />
          {query && <button className={styles.clearBtn} onClick={() => setQuery("")}><X size={18}/></button>}
        </div>

        {selected ? (
          <div className={styles.detail}>
            <button className={styles.backBtn} onClick={() => setSelected(null)}>← Quay lại</button>
            <div className={styles.detailHanzi}>{selected.word}</div>
            <div className={styles.detailPinyin}>{selected.pinyin}</div>
            <div className={styles.detailMeaning}>{selected.meaning}</div>
            {selected.word_type && <span className={styles.wordType}>{selected.word_type}</span>}
            {selected.lesson && <div className={styles.lesson}>📚 {selected.lesson}</div>}
            <div className={styles.detailActions}>
              <button className={styles.speakBtn} onClick={() => speak(selected.word)}><Volume2 size={18}/> Phát âm</button>
              <button className={`${styles.starBtn} ${isStarred(selected.id) ? styles.starred : ""}`} onClick={() => toggleStar(selected.id)}>
                <Star size={18}/> {isStarred(selected.id) ? "Bỏ đánh dấu" : "Đánh dấu"}
              </button>
            </div>
          </div>
        ) : query.trim() === "" ? (
          <div className={styles.emptyHint}>
            <Search size={40} style={{opacity:0.15, margin:'1.5rem auto', display:'block'}}/>
            <p>Tìm kiếm trong {vocab.length} từ đã học</p>
            <p style={{color:'#9ca3af', fontSize:'0.8rem'}}>Ctrl+K để mở/đóng</p>
          </div>
        ) : results.length === 0 ? (
          <div className={styles.emptyHint}><p>Không tìm thấy từ nào phù hợp</p></div>
        ) : (
          <ul className={styles.results}>
            {results.map(w => (
              <li key={w.id} className={styles.resultItem} onClick={() => setSelected(w)}>
                <span className={`${styles.hanzi} hanzi`}>{w.word}</span>
                <span className={styles.pinyin}>{w.pinyin}</span>
                <span className={styles.meaning}>{w.meaning}</span>
                {isStarred(w.id) && <Star size={14} className={styles.starIcon}/>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

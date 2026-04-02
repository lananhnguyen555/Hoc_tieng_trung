"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Play, BookOpen, RefreshCw, Plus, FileUp, X, Download, Trash2, Edit2, Maximize2 } from "lucide-react";
import styles from "./vocab.module.css";
import HanziWriter from "hanzi-writer";
import { supabase } from "@/lib/supabase";
import HanziSuggester from "@/components/HanziSuggester";
import { pinyin as getPinyin } from "pinyin-pro";
import { getHanViet } from "@/lib/han-viet";

// MOCK DATA
const MOCK_VOCAB = [
  { id: "1", word: "学习", pinyin: "xuéxí", meaning: "Học tập", lesson: "Buổi 1" },
  { id: "2", word: "老师", pinyin: "lǎoshī", meaning: "Giáo viên", lesson: "Buổi 1" },
  { id: "3", word: "学生", pinyin: "xuésheng", meaning: "Học sinh", lesson: "Buổi 1" },
  { id: "4", word: "汉语", pinyin: "Hànyǔ", meaning: "Tiếng Hán", lesson: "Buổi 1" },
];

export default function VocabList() {
  const [search, setSearch] = useState("");
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [vocab, setVocab] = useState<any[]>(MOCK_VOCAB);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [editingWord, setEditingWord] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const writerRef = useRef<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fullscreen Hanzi State
  const [fullScreenWord, setFullScreenWord] = useState<string | null>(null);

  // Form States
  const [newWord, setNewWord] = useState({ 
    word: "", 
    pinyin: "", 
    meaning: "", 
    lesson_id: "",
    example_cn: "",
    example_py: "",
    example_vi: ""
  });
  const [newLessonName, setNewLessonName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      setLessons([...(dbLessons || []), ...localLessons]);

      const { data: dbVocab, error } = await supabase.from("vocab").select("*, lessons(name, id)");
      let combinedVocab = [...MOCK_VOCAB.map(v => ({...v, lesson_id: "mock"}))];

      if (!error && dbVocab) {
        const dbMapped = dbVocab.map((item: any) => ({
          ...item,
          lesson: item.lessons?.name || "Kho chung",
          lesson_id: item.lesson_id
        }));
        combinedVocab = [...combinedVocab, ...dbMapped];
      }

      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      setVocab([...combinedVocab, ...localVocab]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const lessonObj = lessons.find(l => l.id === newWord.lesson_id);
    const newEntry = { 
      ...newWord, 
      id: `local-word-${Date.now()}`,
      lesson: lessonObj?.name || "Cá nhân",
      lesson_id: newWord.lesson_id
    };

    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    localStorage.setItem("user_vocab", JSON.stringify([...localVocab, newEntry]));
    
    setVocab(prev => [...prev, newEntry]);
    setShowAddModal(false);
  };

  const handleDeleteWord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa từ vựng này?")) return;
    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    const updatedLocal = localVocab.filter((v: any) => v.id !== id);
    localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
    setVocab(prev => prev.filter(v => v.id !== id));
  };

  const filteredVocab = vocab.filter(item => {
    const matchesSearch = item.word.includes(search) || item.meaning.toLowerCase().includes(search.toLowerCase());
    const matchesLesson = selectedLessonId === "all" || item.lesson_id === selectedLessonId;
    return matchesSearch && matchesLesson;
  });

  return (
    <div className={styles.listContainer}>
      {/* Sidebar Lesson Filter */}
      <div className={styles.lessonFilter}>
        <div className={styles.lessonHeader}>
          <h3>Buổi học</h3>
          <button className={styles.addLessonBtn} onClick={() => setShowAddLessonModal(true)}>
            <Plus size={14} /> Mới
          </button>
        </div>
        <div className={styles.lessonTabs}>
          <button 
            className={selectedLessonId === "all" ? styles.activeTab : ""}
            onClick={() => setSelectedLessonId("all")}
          >
            Tất cả bài học
          </button>
          {lessons.map(lesson => (
            <button 
              key={lesson.id}
              className={selectedLessonId === lesson.id ? styles.activeTab : ""}
              onClick={() => setSelectedLessonId(lesson.id)}
            >
              {lesson.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.topActions}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="Hán tự, pinyin hoặc nghĩa..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Thêm từ mới
            </button>
          </div>
        </div>

        {/* Vocab Table Content */}
        {loading ? (
          <div className={styles.loader}>Đang tải kho từ vựng...</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.vocabTable}>
              <thead>
                <tr>
                  <th className={styles.sttCell}>STT</th>
                  <th>Hán tự (Thư pháp)</th>
                  <th>Pinyin</th>
                  <th>Nghĩa</th>
                  <th>Ví dụ hướng dẫn</th>
                  <th className={styles.actionCell}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredVocab.map((item, index) => (
                  <tr key={item.id}>
                    <td className={styles.sttCell}>{index + 1}</td>
                    <td 
                      className={`${styles.wordCell} hanzi`}
                      onClick={() => setFullScreenWord(item.word)}
                      title="Nhấn để phóng to chữ Hán"
                    >
                      {item.word}
                    </td>
                    <td className={styles.pinyinCell}>{item.pinyin}</td>
                    <td className={styles.meaningCell}>{item.meaning}</td>
                    <td className={styles.exampleCell}>
                      {item.example_cn ? (
                        <div className={styles.exampleItem}>
                          <p className={`${styles.exampleCn} hanzi`} onClick={() => setFullScreenWord(item.example_cn)}>{item.example_cn}</p>
                          <p className={styles.examplePy}>{item.example_py}</p>
                          <p className={styles.exampleVi}>{item.example_vi}</p>
                        </div>
                      ) : <span style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>Chưa cập nhật ví dụ</span>}
                    </td>
                    <td className={styles.actionCell}>
                      <div className={styles.iconBtnGroup}>
                        <button className={styles.iconBtn} onClick={() => speak(item.word)} title="Phát âm">
                          <Play size={16} fill="currentColor" />
                        </button>
                        <button className={styles.iconBtn} onClick={() => { setEditingWord(item); setShowEditModal(true); }} title="Sửa">
                          <Edit2 size={16} />
                        </button>
                        <button className={styles.iconBtn} onClick={(e) => handleDeleteWord(item.id, e)} title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredVocab.length === 0 && (
              <div className={styles.empty}>Không tìm thấy từ vựng nào.</div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Hanzi View Overlay */}
      {fullScreenWord && (
        <div className={styles.fullscreenOverlay} onClick={() => setFullScreenWord(null)}>
          <div className={`${styles.fullscreenHanzi} hanzi`}>
            {fullScreenWord.match(/[\u4e00-\u9fa5]+/g)?.[0] || fullScreenWord}
          </div>
          <p style={{marginTop:'2rem', fontSize:'1.5rem', fontWeight:600}}>Phóng to chữ Hán thư pháp (Ma Shan Zheng)</p>
          <p>Nhấp vào bất kỳ đâu để đóng</p>
        </div>
      )}

      {/* Simplified Modal Structure for Add/Edit Word */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`card ${styles.modal}`} style={{maxWidth:'550px'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
              <h2 style={{margin:0}}>Thêm từ mới</h2>
              <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddWord} style={{display:'flex', flexDirection:'column', gap:'1.2rem'}}>
              <select 
                value={newWord.lesson_id} 
                onChange={e => setNewWord({...newWord, lesson_id: e.target.value})}
                required
                style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
              >
                <option value="">Chọn buổi học</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="Hán tự (Ví dụ: 你)" 
                value={newWord.word}
                onChange={e => setNewWord({...newWord, word: e.target.value})}
                required
                style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
              />
              <input 
                type="text" 
                placeholder="Pinyin" 
                value={newWord.pinyin}
                onChange={e => setNewWord({...newWord, pinyin: e.target.value})}
                style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
              />
              <input 
                type="text" 
                placeholder="Nghĩa tiếng Việt" 
                value={newWord.meaning}
                onChange={e => setNewWord({...newWord, meaning: e.target.value})}
                required
                style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
              />
              <div style={{borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
                <p style={{fontSize:'0.9rem', fontWeight:700, marginBottom:'0.5rem'}}>Ví dụ (Tùy chọn)</p>
                <input 
                  type="text" 
                  placeholder="Câu ví dụ Hán tự" 
                  value={newWord.example_cn}
                  onChange={e => setNewWord({...newWord, example_cn: e.target.value})}
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', width:'100%', marginBottom:'0.5rem'}}
                />
                 <input 
                  type="text" 
                  placeholder="Pinyin ví dụ" 
                  value={newWord.example_py}
                  onChange={e => setNewWord({...newWord, example_py: e.target.value})}
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', width:'100%', marginBottom:'0.5rem'}}
                />
                 <input 
                  type="text" 
                  placeholder="Nghĩa ví dụ" 
                  value={newWord.example_vi}
                  onChange={e => setNewWord({...newWord, example_vi: e.target.value})}
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', width:'100%'}}
                />
              </div>
              <button type="submit" className="btn-primary" style={{padding:'1rem'}}>Lưu vào từ điển</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

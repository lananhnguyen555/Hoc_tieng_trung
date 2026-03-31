"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Play, BookOpen, RefreshCw, Plus, FileUp, X, Download, Trash2, Edit2 } from "lucide-react";
import styles from "./vocab.module.css";
import HanziWriter from "hanzi-writer";
import { supabase } from "@/lib/supabase";
import HanziSuggester from "@/components/HanziSuggester";
import { pinyin as getPinyin } from "pinyin-pro";

// MOCK DATA
const MOCK_VOCAB = [
  { id: "1", word: "学习", pinyin: "xuéxí", meaning: "Học tập", lesson: "Buổi 1" },
  { id: "2", word: "老师", pinyin: "lǎoshī", meaning: "Giáo viên", lesson: "Buổi 1" },
  { id: "3", word: "学生", pinyin: "xuésheng", meaning: "Học sinh", lesson: "Buổi 1" },
  { id: "4", word: "汉语", pinyin: "Hànyǔ", meaning: "Tiếng Hán", lesson: "Buổi 2" },
  { id: "5", word: "谢谢", pinyin: "xièxie", meaning: "Cảm ơn", lesson: "Buổi 2" },
  { id: "6", word: "不客气", pinyin: "bú kèqi", meaning: "Đừng khách khí", lesson: "Buổi 2" },
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
  const writerRef = useRef<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!window.speechSynthesis) {
      alert("Trình duyệt không hỗ trợ phát âm.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Lessons (DB + Local)
      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      const combinedLessons = [
        ...(dbLessons || []),
        ...localLessons
      ];
      setLessons(combinedLessons);

      // 2. Fetch Vocab (DB + Local + Mock)
      const { data: dbVocab, error } = await supabase
        .from("vocab")
        .select("*, lessons(name, id)");
      
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
      combinedVocab = [...combinedVocab, ...localVocab];

      setVocab(combinedVocab);
    } catch (err) {
      console.log("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonName) return;

    const newLesson = { 
      id: `local-lesson-${Date.now()}`, 
      name: newLessonName,
      created_at: new Date().toISOString()
    };
    
    const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
    localStorage.setItem("user_lessons", JSON.stringify([...localLessons, newLesson]));
    
    setLessons(prev => [...prev, newLesson]);
    setNewLessonName("");
    setShowAddLessonModal(false);
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
    setNewWord({ 
      word: "", 
      pinyin: "", 
      meaning: "", 
      lesson_id: selectedLessonId !== "all" ? selectedLessonId : "",
      example_cn: "",
      example_py: "",
      example_vi: ""
    });
  };

  const handleDeleteWord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa từ vựng này?")) return;
    
    // Remote delete if applicable, or just local
    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    const updatedLocal = localVocab.filter((v: any) => v.id !== id);
    localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
    
    setVocab(prev => prev.filter(v => v.id !== id));
  };

  const openEditModal = (word: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWord({ ...word });
    setShowEditModal(true);
  };

  const handleUpdateWord = (e: React.FormEvent) => {
    e.preventDefault();
    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    const updatedLocal = localVocab.map((v: any) => v.id === editingWord.id ? editingWord : v);
    localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
    
    setVocab(prev => prev.map(v => v.id === editingWord.id ? editingWord : v));
    setShowEditModal(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newWord.lesson_id) {
      alert("Vui lòng chọn Buổi học trước khi import!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const newEntries: any[] = [];
      const lessonObj = lessons.find(l => l.id === newWord.lesson_id);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [word, pinyin, meaning] = line.split(",").map(s => s.trim());
        if (word && pinyin && meaning) {
          newEntries.push({
            id: `local-word-${Date.now()}-${i}`,
            word,
            pinyin,
            meaning,
            lesson_id: newWord.lesson_id,
            lesson: lessonObj?.name || "Imported"
          });
        }
      }

      if (newEntries.length > 0) {
        const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
        localStorage.setItem("user_vocab", JSON.stringify([...localVocab, ...newEntries]));
        setVocab(prev => [...prev, ...newEntries]);
        setShowImportModal(false);
        alert(`Đã nhập thành công ${newEntries.length} từ!`);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "hanzi,pinyin,meaning\n学习,xuéxí,Học tập\n老师,lǎoshī,Giáo viên";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vocab_template.csv");
    link.click();
  };

  useEffect(() => {
    if (selectedWord) {
      const target = document.getElementById("hanzi-target");
      if (target) target.innerHTML = "";
      writerRef.current = [];

      const chars = selectedWord.word.split("");
      chars.forEach((char: string) => {
        const writer = HanziWriter.create("hanzi-target", char, {
          width: 150,
          height: 150,
          padding: 5,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 200,
          strokeColor: "#0ea5e9",
          outlineColor: "#e2e8f0",
        });
        writerRef.current.push(writer);
      });
    }
  }, [selectedWord]);

  const animateHanzi = () => {
    writerRef.current.forEach((writer, index) => {
      setTimeout(() => {
        writer.animateCharacter();
      }, index * 1000);
    });
  };

  const filteredVocab = vocab.filter(item => {
    if (selectedLessonId === "all") return false; // Hien tai khong hien thi gi o trang 'Tat ca'
    
    const matchesSearch = item.word.includes(search) ||
                          item.pinyin.toLowerCase().includes(search.toLowerCase()) ||
                          item.meaning.toLowerCase().includes(search.toLowerCase());
    const matchesLesson = item.lesson_id === selectedLessonId;
    return matchesSearch && matchesLesson;
  });

  return (
    <div className={styles.listContainer}>
      {/* Lesson Filter Sidebar/Tabs */}
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
            Tất cả
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
              placeholder="Tìm kiếm từ vựng..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selectedLessonId !== "all" && (
            <div className={styles.buttonGroup}>
              <button className={styles.actionBtn} onClick={() => {
                setNewWord(prev => ({...prev, lesson_id: selectedLessonId}));
                setShowImportModal(true);
              }}>
                <FileUp size={18} /> Nhập CSV
              </button>
              <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={() => {
                setNewWord(prev => ({...prev, lesson_id: selectedLessonId}));
                setShowAddModal(true);
              }}>
                <Plus size={18} /> Thêm từ mới
              </button>
            </div>
          )}
        </div>

        <div className={styles.grid}>
          {loading ? (
            <div className={styles.loader}>Đang tải dữ liệu...</div>
          ) : selectedLessonId === "all" ? (
            <div className={styles.empty}>Vui lòng chọn một buổi học ở bên trái để bắt đầu.</div>
          ) : filteredVocab.length === 0 ? (
            <div className={styles.empty}>Chưa có từ vựng nào trong buổi này.</div>
          ) : (
            filteredVocab.map((item) => (
              <div
                key={item.id}
                className={`card ${styles.vocabCard}`}
                onClick={() => setSelectedWord(item)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.leftActions}>
                    <button 
                      className={styles.audioBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(item.word);
                      }}
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  </div>
                  <div className={styles.rightActions}>
                    <button className={styles.iconBtn} onClick={(e) => openEditModal(item, e)}>
                      <Edit2 size={14} />
                    </button>
                    <button className={styles.iconBtn} onClick={(e) => handleDeleteWord(item.id, e)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className={styles.cardMain}>
                  <span className={styles.word}>{item.word}</span>
                  <span className={styles.pinyin}>{item.pinyin}</span>
                  <span className={styles.meaning}>{item.meaning}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Detail */}
      {selectedWord && (
        <div className={styles.modalOverlay} onClick={() => setSelectedWord(null)}>
          <div className={`card ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedWord(null)}>×</button>
            <div className={styles.modalContent}>
              <div className={styles.modalLeft}>
                <div className={styles.modalHeader}>
                  <span className={styles.modalPinyin}>{selectedWord.pinyin}</span>
                  <p className={styles.modalMeaning}>{selectedWord.meaning}</p>
                </div>
                
                <div className={styles.hanziContainer}>
                  <div id="hanzi-target" className={styles.hanziBox}></div>
                  <button className={styles.animateBtn} onClick={animateHanzi}>
                    <RefreshCw size={18} /> Viết lại
                  </button>
                </div>
              </div>
              <div className={styles.modalRight}>
                <h3>Ví dụ & Ngữ pháp</h3>
                <div className={styles.exampleList}>
                  {selectedWord.example_cn ? (
                    <div className={styles.exampleItem}>
                      <p className={styles.exampleCn}>{selectedWord.example_cn}</p>
                      <p className={styles.examplePy}>{selectedWord.example_py}</p>
                      <p className={styles.exampleVi}>{selectedWord.example_vi}</p>
                    </div>
                  ) : (
                    <div className={styles.emptyExample}>Chưa có ví dụ cho từ này. Bạn có thể tự thêm ở phần Sửa.</div>
                  )}
                </div>
                <button className={styles.aiGenBtn}>
                  <BookOpen size={16} /> Sinh ví dụ với AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`card ${styles.smallModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderRow}>
              <h2>Thêm từ mới</h2>
              <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddWord} className={styles.addForm}>
              <div className={styles.formGroup}>
                <label>Buổi học</label>
                <select 
                  value={newWord.lesson_id} 
                  onChange={e => setNewWord({...newWord, lesson_id: e.target.value})}
                  required
                >
                  <option value="">Chọn buổi học</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Pinyin</label>
                <input 
                  type="text" 
                  value={newWord.pinyin} 
                  onChange={e => setNewWord({...newWord, pinyin: e.target.value})}
                  placeholder="Ví dụ: xuéxí" 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Hán tự</label>
                <input 
                  type="text" 
                  value={newWord.word} 
                  onChange={e => setNewWord({...newWord, word: e.target.value})}
                  placeholder="Ví dụ: 学习" 
                  required 
                />
                <HanziSuggester 
                  pinyin={newWord.pinyin} 
                  onSelect={(char, _) => {
                    const fullChar = newWord.word + char;
                    const fullPinyin = getPinyin(fullChar, { toneType: "symbol" }).replace(/\s+/g, '');
                    setNewWord({...newWord, word: fullChar, pinyin: fullPinyin});
                  }} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nghĩa</label>
                <input 
                  type="text" 
                  value={newWord.meaning} 
                  onChange={e => setNewWord({...newWord, meaning: e.target.value})}
                  placeholder="Ví dụ: Học tập" 
                  required 
                />
              </div>
              
              <div className={styles.exampleToggle}>
                <label>Ví dụ (Không bắt buộc)</label>
                <input 
                  type="text" 
                  placeholder="Tiếng Trung"
                  value={newWord.example_cn || ""}
                  onChange={e => setNewWord({...newWord, example_cn: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Pinyin"
                  value={newWord.example_py || ""}
                  onChange={e => setNewWord({...newWord, example_py: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Nghĩa tiếng Việt"
                  value={newWord.example_vi || ""}
                  onChange={e => setNewWord({...newWord, example_vi: e.target.value})}
                />
              </div>

              <button type="submit" className="btn-primary">Lưu lại</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddLessonModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddLessonModal(false)}>
          <div className={`card ${styles.smallModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderRow}>
              <h2>Buổi học mới</h2>
              <button onClick={() => setShowAddLessonModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddLesson} className={styles.addForm}>
              <div className={styles.formGroup}>
                <label>Tên buổi học</label>
                <input 
                  type="text" 
                  value={newLessonName} 
                  onChange={e => setNewLessonName(e.target.value)}
                  placeholder="Ví dụ: Buổi 1, Chủ đề Gia đình..." 
                  required 
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary">Tạo buổi học</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Word Modal */}
      {showEditModal && editingWord && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={`card ${styles.smallModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderRow}>
              <h2>Sửa từ vựng</h2>
              <button onClick={() => setShowEditModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdateWord} className={styles.addForm}>
              <div className={styles.formGroup}>
                <label>Pinyin</label>
                <input 
                  type="text" 
                  value={editingWord.pinyin} 
                  onChange={e => setEditingWord({...editingWord, pinyin: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Hán tự</label>
                <input 
                  type="text" 
                  value={editingWord.word} 
                  onChange={e => setEditingWord({...editingWord, word: e.target.value})}
                  required 
                />
                <HanziSuggester 
                  pinyin={editingWord.pinyin} 
                  onSelect={(char, accented) => {
                    const fullChar = editingWord.word + char;
                    const fullPinyin = getPinyin(fullChar, { toneType: "symbol" }).replace(/\s+/g, '');
                    setNewWord({...editingWord, word: fullChar, pinyin: fullPinyin});
                  }} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nghĩa</label>
                <input 
                  type="text" 
                  value={editingWord.meaning} 
                  onChange={e => setEditingWord({...editingWord, meaning: e.target.value})}
                  required 
                />
              </div>

              <div className={styles.exampleToggle}>
                <label>Ví dụ (Không bắt buộc)</label>
                <input 
                  type="text" 
                  placeholder="Tiếng Trung"
                  value={editingWord.example_cn || ""}
                  onChange={e => setEditingWord({...editingWord, example_cn: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Pinyin"
                  value={editingWord.example_py || ""}
                  onChange={e => setEditingWord({...editingWord, example_py: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Nghĩa tiếng Việt"
                  value={editingWord.example_vi || ""}
                  onChange={e => setEditingWord({...editingWord, example_vi: e.target.value})}
                />
              </div>

              <button type="submit" className="btn-primary">Cập nhật</button>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={`card ${styles.smallModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeaderRow}>
              <h2>Nhập từ file CSV</h2>
              <button onClick={() => setShowImportModal(false)}><X size={24} /></button>
            </div>
            <div className={styles.importModalContent}>
              <div className={styles.formGroup} style={{ textAlign: "left" }}>
                <label>Chọn buổi học đích</label>
                <select 
                  value={newWord.lesson_id} 
                  onChange={e => setNewWord({...newWord, lesson_id: e.target.value})}
                  required
                >
                  <option value="">Chọn buổi học</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className={styles.importButtons}>
                <button className={styles.outlineBtn} onClick={downloadTemplate}>
                  <Download size={18} /> Tải file mẫu
                </button>
                <button className={styles.actionBtn} onClick={() => fileInputRef.current?.click()}>
                  <FileUp size={18} /> Chọn file CSV
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImportCSV} 
                  style={{ display: "none" }} 
                  accept=".csv"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

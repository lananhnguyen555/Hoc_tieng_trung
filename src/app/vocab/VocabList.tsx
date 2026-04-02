"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Play, Plus, X, Edit2, Trash2, ChevronDown, BookOpen, Save, FileUp, LogIn } from "lucide-react";
import styles from "./vocab.module.css";
import HanziWriter from "hanzi-writer";
import { supabase } from "@/lib/supabase";
import HanziSuggester from "@/components/HanziSuggester";
import { HAN_VIET_DATA } from "@/lib/han-viet";
import * as XLSX from "xlsx";

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  lesson_id: string;
  lesson?: string;
  example_cn?: string;
  example_py?: string;
  example_vi?: string;
}

export default function VocabList() {
  const [search, setSearch] = useState("");
  const [vocab, setVocab] = useState<Word[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [detailedWord, setDetailedWord] = useState<Word | null>(null);
  
  // Form states
  const [newWord, setNewWord] = useState({ 
    word: "", pinyin: "", meaning: "", lesson_id: "", 
    example_cn: "", example_py: "", example_vi: "" 
  });
  const [pinyinInput, setPinyinInput] = useState("");
  const [editingExample, setEditingExample] = useState({ cn: "", py: "", vi: "" });

  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const writerContainerRef = useRef<HTMLDivElement>(null);
  const writerInstance = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setNewWord({ 
      word: "", pinyin: "", meaning: "", 
      lesson_id: selectedLessonId === "all" ? "" : selectedLessonId, 
      example_cn: "", example_py: "", example_vi: "" 
    });
    setPinyinInput("");
    setShowAddModal(true);
  };

  const handleSelectSuggestion = async (char: string, accented: string) => {
    setNewWord(prev => ({ ...prev, word: char, pinyin: accented.replace(/\s+/g, '') }));
    
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(char)}`);
      const data = await res.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translation = data[0][0][0];
        setNewWord(prev => ({ ...prev, meaning: translation }));
      } else {
        const hv = char.split('').map(c => HAN_VIET_DATA[c] || c).join(' ');
        setNewWord(prev => ({ ...prev, meaning: hv }));
      }
    } catch (err) {
      console.error("Dịch Google lỗi:", err);
      const hv = char.split('').map(c => HAN_VIET_DATA[c] || c).join(' ');
      setNewWord(prev => ({ ...prev, meaning: hv }));
    }
  };

  // ... (HanziWriter effect remains same) ...
  useEffect(() => {
    if (detailedWord && writerContainerRef.current) {
      writerContainerRef.current.innerHTML = '';
      const characters = detailedWord.word.split('');
      const charToDraw = characters[currentCharIndex] || characters[0];
      writerInstance.current = HanziWriter.create(writerContainerRef.current, charToDraw, {
        width: 250, height: 250, padding: 5, strokeColor: '#0ea5e9', outlineColor: '#eee', drawingColor: '#333',
        showOutline: true, delayBetweenLoops: 1000
      });
      writerInstance.current.animateCharacter({
        onComplete: () => {
          if (currentCharIndex < characters.length - 1) {
            setTimeout(() => setCurrentCharIndex(prev => prev + 1), 1000);
          }
        }
      });
      if (currentCharIndex === 0) {
        setEditingExample({ cn: detailedWord.example_cn || "", py: detailedWord.example_py || "", vi: detailedWord.example_vi || "" });
      }
    }
  }, [detailedWord, currentCharIndex]);

  const handleOpenDetailed = (word: Word) => {
    setCurrentCharIndex(0);
    setDetailedWord(word);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      setLessons([...(dbLessons || []), ...localLessons]);

      const { data: dbVocab, error } = await supabase.from("vocab").select("*, lessons(name, id)");
      let combinedVocab: Word[] = [];

      if (!error && dbVocab) {
        combinedVocab = dbVocab.map((item: any) => ({
          ...item,
          lesson: item.lessons?.name || "Kho chung",
          lesson_id: item.lesson_id
        }));
      }

      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      setVocab([...combinedVocab, ...localVocab]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedLessonId === "all") {
      alert("Vui lòng chọn một buổi học cụ thể trước khi nhập file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const rows = content.split("\n").filter(row => row.trim());
      
      const importedVocab: Word[] = rows.slice(1).map(row => {
        const [word, pinyin, meaning, ex_cn, ex_py, ex_vi] = row.split(",").map(s => s.trim());
        return {
          id: `csv-${Date.now()}-${Math.random()}`,
          word, pinyin: (pinyin || "").replace(/\s+/g, ''),
          meaning: meaning || "",
          lesson_id: selectedLessonId,
          example_cn: ex_cn || "",
          example_py: ex_py || "",
          example_vi: ex_vi || ""
        };
      });

      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      const updatedLocal = [...localVocab, ...importedVocab];
      localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
      setVocab(prev => [...prev, ...importedVocab]);
      setShowImportModal(false);
      alert(`Đã nhập thành công ${importedVocab.length} từ!`);
    };
    reader.readAsText(file);
  };

  const handleSaveNewWord = () => {
    if (!newWord.word || !newWord.meaning || !newWord.lesson_id) {
      alert("Vui lòng nhập đầy đủ Hán tự, Nghĩa và chọn Buổi học!");
      return;
    }

    const wordToAdd: Word = {
      ...newWord,
      id: `local-${Date.now()}`
    };

    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    localStorage.setItem("user_vocab", JSON.stringify([...localVocab, wordToAdd]));
    setVocab(prev => [...prev, wordToAdd]);
    setShowAddModal(false);
    setNewWord({ word: "", pinyin: "", meaning: "", lesson_id: "", example_cn: "", example_py: "", example_vi: "" });
    alert("Đã thêm từ mới thành công!");
  };

  const handleSaveExample = () => {
    if (!detailedWord) return;
    const updatedWord = { ...detailedWord, example_cn: editingExample.cn, example_py: editingExample.py, example_vi: editingExample.vi };
    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    const updatedLocal = localVocab.map((v: any) => v.id === detailedWord.id ? updatedWord : v);
    localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
    setVocab(prev => prev.map(v => v.id === detailedWord.id ? updatedWord : v));
    setDetailedWord(updatedWord);
    alert("Đã lưu ví dụ thành công!");
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN"; utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleAddLesson = () => {
    const name = prompt("Nhập tên buổi học mới (Ví dụ: Buổi 4):");
    if (!name) return;
    
    const newLesson = { id: `lesson-${Date.now()}`, name };
    const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
    const updated = [...localLessons, newLesson];
    localStorage.setItem("user_lessons", JSON.stringify(updated));
    setLessons(prev => [...prev, newLesson]);
    setSelectedLessonId(newLesson.id);
    alert(`Đã thêm ${name} thành công!`);
  };

  const handleDeleteLesson = () => {
    if (selectedLessonId === "all") return;
    const lessonName = lessons.find(l => l.id === selectedLessonId)?.name;
    if (!confirm(`Bạn có chắc chắn muốn xóa "${lessonName}" và TOÀN BỘ từ vựng trong buổi này?`)) return;
    
    // Remove lesson
    const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
    const updatedLessons = localLessons.filter((l: any) => l.id !== selectedLessonId);
    localStorage.setItem("user_lessons", JSON.stringify(updatedLessons));
    setLessons(prev => prev.filter(l => l.id !== selectedLessonId));
    
    // Remove vocab of this lesson
    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    const updatedVocab = localVocab.filter((v: any) => v.lesson_id !== selectedLessonId);
    localStorage.setItem("user_vocab", JSON.stringify(updatedVocab));
    setVocab(updatedVocab);
    
    setSelectedLessonId("all");
    alert("Đã xóa buổi học thành công!");
  };

  const handleExportExcel = () => {
    if (filteredVocab.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }
    
    const lessonName = lessons.find(l => l.id === selectedLessonId)?.name || "Tu_Vung";
    const dataToExport = filteredVocab.map((item, index) => ({
      "STT": index + 1,
      "Hán tự": item.word,
      "Pinyin": item.pinyin,
      "Nghĩa Việt": item.meaning,
      "Ví dụ (Hán)": item.example_cn || "",
      "Ví dụ (Pinyin)": item.example_py || "",
      "Ví dụ (Nghĩa)": item.example_vi || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TuVung");
    
    XLSX.writeFile(workbook, `${lessonName}_${new Date().toLocaleDateString()}.xlsx`);
  };

  const filteredVocab = vocab.filter(item => {
    if (selectedLessonId === "all") return false;
    const matchesSearch = item.word.includes(search) || item.meaning.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && item.lesson_id === selectedLessonId;
  });

  return (
    <div className={styles.container}>
      {/* ... (Header and Toolbar remains same) ... */}
      <header className={styles.header}>
        <h1 className={styles.title}>Từ vựng Tiếng Trung</h1>
        <p className={styles.subtitle}>Sử dụng hệ thống bảng và hướng dẫn viết sinh động.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterSection}>
          <label style={{fontWeight:700}}>Buổi học:</label>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <select className={styles.lessonSelect} value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)}>
              <option value="all">--- Chọn buổi học ---</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button className={styles.iconBtn} onClick={handleAddLesson} title="Thêm buổi học mới" style={{padding:'5px', background:'var(--primary)', color:'white', borderRadius:'4px', display:'flex'}}>
              <Plus size={20} />
            </button>
            {selectedLessonId !== "all" && (
              <button className={styles.iconBtn} onClick={handleDeleteLesson} title="Xóa buổi này" style={{padding:'5px', background:'#ef4444', color:'white', borderRadius:'4px', display:'flex'}}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input type="text" placeholder="Tìm kiếm từ vựng..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className={styles.actionBtns}>
          <button className={styles.addBtn} style={{background:'#1ea362', color:'white'}} onClick={handleExportExcel}>
            <FileUp size={20} /> Xuất Excel
          </button>
          <button className={styles.addBtn} style={{background:'var(--foreground)', color:'white'}} onClick={() => setShowImportModal(true)}>
            <LogIn size={20} /> Nhập CSV
          </button>
          <button className={styles.addBtn} onClick={handleOpenAddModal}>
            <Plus size={20} /> Thêm từ mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Đang đồng bộ dữ liệu...</div>
      ) : selectedLessonId === "all" ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} style={{opacity:0.2, marginBottom:'1rem'}} />
          <p>Hãy chọn một bài học từ Menu thả xuống phía trên để bắt đầu học từ vựng nhé!</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.vocabTable}>
            <thead>
              <tr>
                <th className={styles.sttCell}>STT</th>
                <th>Hán tự (Click Zoom)</th>
                <th>Pinyin</th>
                <th>Nghĩa Việt</th>
                <th className={styles.actionCell}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVocab.map((item, index) => (
                <tr key={item.id}>
                  <td className={styles.sttCell}>{index + 1}</td>
                  <td className={`${styles.wordCell} hanzi`} onClick={() => handleOpenDetailed(item)}>{item.word}</td>
                  <td className={styles.pinyinCell}>{item.pinyin}</td>
                  <td className={styles.meaningCell}>{item.meaning}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.iconGroup}>
                      <button className={styles.iconBtn} onClick={() => speak(item.word)}><Play size={16} /></button>
                      <button className={styles.iconBtn} onClick={() => handleOpenDetailed(item)}><Edit2 size={16} /></button>
                      <button className={styles.iconBtn}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVocab.length === 0 && <div className={styles.emptyState}>Bài học này hiện chưa có từ vựng nào.</div>}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.detailModal} style={{maxWidth:'500px', padding:'2rem'}} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom:'1rem'}}>Nhập từ vựng từ CSV</h2>
            <p style={{fontSize:'0.9rem', color:'var(--text-muted)', marginBottom:'1.5rem'}}>
              Định dạng file .csv: <b>Hán tự, Pinyin, Nghĩa, Ví dụ Hán tự, Ví dụ Pinyin, Ví dụ Nghĩa</b>.
              Dòng đầu tiên sẽ được coi là tiêu đề.
            </p>
            {selectedLessonId === "all" ? (
              <p style={{color:'red', fontWeight:700}}>Vui lòng chọn bài học ở trang chính trước khi nhấn Nhập!</p>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                <p>Đang chọn: <b>{lessons.find(l => l.id === selectedLessonId)?.name}</b></p>
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} style={{display:'none'}} />
                <button className={styles.saveBtn} onClick={() => fileInputRef.current?.click()}>Chọn file .csv và Nhập</button>
              </div>
            )}
            <button style={{marginTop:'1.5rem', width:'100%', padding:'0.8rem'}} onClick={() => setShowImportModal(false)}>Đóng</button>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.detailModal} style={{maxWidth:'600px', padding:'2rem'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h2>Thêm từ vựng mới</h2>
              <X className={styles.closeBtn} onClick={() => setShowAddModal(false)} />
            </div>
            
            <div className={styles.formGroup} style={{marginBottom:'1rem'}}>
              <label>Gõ Pinyin để lấy Hán tự gợi ý</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="Ví dụ: xuexi" 
                value={pinyinInput} 
                onChange={e => setPinyinInput(e.target.value)} 
              />
            </div>
            {pinyinInput && (
              <HanziSuggester pinyin={pinyinInput} onSelect={handleSelectSuggestion} />
            )}

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div className={styles.formGroup}>
                <label>Hán tự *</label>
                <input type="text" className={styles.formInput} value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Pinyin *</label>
                <input type="text" className={styles.formInput} value={newWord.pinyin} onChange={e => setNewWord({...newWord, pinyin: e.target.value})} />
              </div>
            </div>

            <div className={styles.formGroup} style={{marginTop:'1rem'}}>
              <label>Nghĩa tiếng Việt *</label>
              <input type="text" className={styles.formInput} value={newWord.meaning} onChange={e => setNewWord({...newWord, meaning: e.target.value})} />
            </div>

            <div className={styles.formGroup} style={{marginTop:'1rem'}}>
              <label>Thuộc buổi học *</label>
              <select className={styles.formInput} value={newWord.lesson_id} onChange={e => setNewWord({...newWord, lesson_id: e.target.value})}>
                <option value="">-- Chọn buổi học --</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div style={{marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem'}}>
              <p style={{fontWeight:700, fontSize:'0.9rem', marginBottom:'0.5rem'}}>Ví dụ đi kèm (Tùy chọn):</p>
              <input type="text" placeholder="Ví dụ Hán tự" className={styles.formInput} style={{marginBottom:'0.5rem'}} value={newWord.example_cn} onChange={e => setNewWord({...newWord, example_cn: e.target.value})} />
              <input type="text" placeholder="Ví dụ Pinyin" className={styles.formInput} style={{marginBottom:'0.5rem'}} value={newWord.example_py} onChange={e => setNewWord({...newWord, example_py: e.target.value})} />
              <input type="text" placeholder="Ví dụ Nghĩa Việt" className={styles.formInput} value={newWord.example_vi} onChange={e => setNewWord({...newWord, example_vi: e.target.value})} />
            </div>

            <button className={styles.saveBtn} style={{marginTop:'2rem', width:'100%'}} onClick={handleSaveNewWord}>Lưu từ vựng</button>
          </div>
        </div>
      )}

      {/* Detailed Word Modal */}
      {detailedWord && (
        <div className={styles.modalOverlay} onClick={() => setDetailedWord(null)}>
          <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
            <div className={styles.detailContent}>
              <div className={styles.hanziSection}>
                <div ref={writerContainerRef} className={styles.writerContainer}></div>
                <div className={styles.charTabs}>
                  {detailedWord.word.split('').map((char, index) => (
                    <button key={index} className={`${styles.charTab} ${currentCharIndex === index ? styles.activeCharTab : ''} hanzi`} onClick={(e) => { e.stopPropagation(); setCurrentCharIndex(index); }} title={`Xem chữ ${char}`}>{char}</button>
                  ))}
                </div>
                <div className={styles.modalControls}>
                  <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setCurrentCharIndex(0); writerInstance.current?.animateCharacter(); }}><Play size={14} style={{marginRight: '5px'}} /> Vẽ lại</button>
                </div>
              </div>
              <div className={styles.infoSection}>
                <div className={styles.mainInfo}>
                  <h2 className="hanzi">{detailedWord.word}</h2>
                  <p style={{color:'var(--primary)'}}>Pinyin: {detailedWord.pinyin}</p>
                  <p>Nghĩa: {detailedWord.meaning}</p>
                </div>
                <div className={styles.exampleForm}>
                  <p style={{fontWeight:700, margin:0}}>Tự thêm ví dụ học tập:</p>
                  <div className={styles.formGroup}><label>Ví dụ (Hán tự)</label><input type="text" className={styles.formInput} value={editingExample.cn} onChange={e => setEditingExample({...editingExample, cn: e.target.value})} /></div>
                  <div className={styles.formGroup}><label>Pinyin</label><input type="text" className={styles.formInput} value={editingExample.py} onChange={e => setEditingExample({...editingExample, py: e.target.value})} /></div>
                  <div className={styles.formGroup}><label>Nghĩa Việt</label><input type="text" className={styles.formInput} value={editingExample.vi} onChange={e => setEditingExample({...editingExample, vi: e.target.value})} /></div>
                  <button className={styles.saveBtn} onClick={handleSaveExample}><Save size={18} style={{marginRight:'0.5rem'}} /> Lưu ví dụ</button>
                </div>
              </div>
            </div>
            <button style={{padding:'1rem', background:'rgba(0,0,0,0.05)', fontWeight:700}} onClick={() => setDetailedWord(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

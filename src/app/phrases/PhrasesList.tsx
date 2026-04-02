"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Play, Plus, X, Edit2, Trash2, BookOpen, MessageCircle } from "lucide-react";
import styles from "../vocab/vocab.module.css";
import HanziWriter from "hanzi-writer";
import { supabase } from "@/lib/supabase";
import HanziSuggester from "@/components/HanziSuggester";
import { HAN_VIET_DATA } from "@/lib/han-viet";
import * as XLSX from "xlsx";
import { FileUp, LogIn } from "lucide-react";
import { pinyin } from "pinyin-pro";

interface Phrase {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  lesson_id: string;
}

export default function PhrasesList() {
  const [search, setSearch] = useState("");
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [detailedPhrase, setDetailedPhrase] = useState<Phrase | null>(null);
  
  const [newPhrase, setNewPhrase] = useState({ 
    word: "", pinyin: "", meaning: "", lesson_id: ""
  });
  const [pinyinInput, setPinyinInput] = useState("");

  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const writerContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const writerInstance = useRef<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setNewPhrase({ 
      word: "", pinyin: "", meaning: "", 
      lesson_id: selectedLessonId === "all" ? "" : selectedLessonId
    });
    setPinyinInput("");
    setShowAddModal(true);
  };

  const handleSelectSuggestion = async (char: string, accented: string) => {
    setNewPhrase(prev => ({ ...prev, word: char, pinyin: accented.replace(/\s+/g, '') }));
    
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(char)}`);
      const data = await res.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translation = data[0][0][0];
        setNewPhrase(prev => ({ ...prev, meaning: translation }));
      }
    } catch (err) {
      console.error("Dịch Google lỗi:", err);
      const hv = char.split('').map(c => HAN_VIET_DATA[c] || c).join(' ');
      setNewPhrase(prev => ({ ...prev, meaning: hv }));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      setLessons([...(dbLessons || []), ...localLessons]);

      // Using a separate key for phrases
      const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");
      setPhrases([...localPhrases]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewPhrase = () => {
    if (!newPhrase.word || !newPhrase.meaning || !newPhrase.lesson_id) {
      alert("Vui lòng nhập đầy đủ câu Hán tự, Nghĩa và chọn Buổi học!");
      return;
    }

    const phraseToAdd: Phrase = {
      ...newPhrase,
      id: `phrase-${Date.now()}`
    };

    const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");
    localStorage.setItem("user_phrases", JSON.stringify([...localPhrases, phraseToAdd]));
    setPhrases(prev => [...prev, phraseToAdd]);
    setShowAddModal(false);
    alert("Đã thêm câu giao tiếp mới thành công!");
  };

  const handleDeletePhrase = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu giao tiếp này?")) return;
    const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");
    const updated = localPhrases.filter((p: any) => p.id !== id);
    localStorage.setItem("user_phrases", JSON.stringify(updated));
    setPhrases(prev => prev.filter(p => p.id !== id));
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN"; utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleAddLesson = () => {
    const name = prompt("Nhập tên buổi tập mới (Ví dụ: Giao tiếp Bài 1):");
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
    if (!confirm(`Bạn có chắc chắn muốn xóa "${lessonName}" và TOÀN BỘ câu giao tiếp trong này?`)) return;
    
    const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
    const updatedLessons = localLessons.filter((l: any) => l.id !== selectedLessonId);
    localStorage.setItem("user_lessons", JSON.stringify(updatedLessons));
    setLessons(prev => prev.filter(l => l.id !== selectedLessonId));
    
    const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");
    const updatedPhrases = localPhrases.filter((p: any) => p.lesson_id !== selectedLessonId);
    localStorage.setItem("user_phrases", JSON.stringify(updatedPhrases));
    setPhrases(updatedPhrases);
    
    setSelectedLessonId("all");
    alert("Đã xóa buổi thành công!");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedLessonId === "all") {
      alert("Vui lòng chọn một bài học cụ thể trước khi nhập file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const dataBuffer = evt.target?.result;
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (!data || data.length === 0) {
          alert("File Excel không có dữ liệu!");
          return;
        }

        const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");
        let updatedPhrases = [...localPhrases];
        let addedCount = 0;

        // Logic thông minh: Chỉ bỏ qua hàng đầu nếu nó chứa chữ "Hán" hoặc "Câu" (tiêu đề)
        const firstCell = String(data[0]?.[0] || "").toLowerCase();
        const startIdx = (firstCell.includes("hán") || firstCell.includes("câu") || firstCell.includes("word") || firstCell.includes("phrase")) ? 1 : 0;

        for (let i = startIdx; i < data.length; i++) {
          const row = data[i];
          const hanzi = String(row[0] || "").trim();
          if (!hanzi || hanzi === "undefined") continue;

          // Khử trùng
          if (updatedPhrases.some(p => p.word === hanzi)) continue;

          let py = "";
          try {
            py = pinyin(hanzi, { toneType: 'symbol' }).replace(/\s+/g, '');
          } catch (e) {
            py = hanzi;
          }

          let meaning = "";
          try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(hanzi)}`);
            const transData = await res.json();
            meaning = transData?.[0]?.[0]?.[0] || "";
          } catch (err) {
            meaning = hanzi.split('').map(c => HAN_VIET_DATA[c] || c).join(' ');
          }

          const newPhrase: Phrase = {
            id: `phrase-excel-${Date.now()}-${i}`,
            word: hanzi,
            pinyin: py,
            meaning: meaning,
            lesson_id: selectedLessonId
          };

          updatedPhrases.push(newPhrase);
          addedCount++;
        }

        localStorage.setItem("user_phrases", JSON.stringify(updatedPhrases));
        setPhrases(updatedPhrases);
        setShowImportModal(false);
        alert(`Thành công! Đã thêm ${addedCount} câu giao tiếp mới (Đã tự động bỏ qua các câu trùng lặp).`);
      } catch (err) {
        console.error("Lỗi nhập Excel Giao tiếp:", err);
        alert("Có lỗi xảy ra khi xử lý file Excel! Vui lòng kiểm tra lại định dạng file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    if (filteredPhrases.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }
    
    const lessonName = lessons.find(l => l.id === selectedLessonId)?.name || "Giao_Tiep";
    const dataToExport = filteredPhrases.map((item, index) => ({
      "STT": index + 1,
      "Hán tự": item.word,
      "Pinyin": item.pinyin,
      "Nghĩa Việt": item.meaning
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GiaoTiep");
    
    XLSX.writeFile(workbook, `${lessonName}_GiaoTiep_${new Date().toLocaleDateString()}.xlsx`);
  };

  const filteredPhrases = phrases.filter(item => {
    if (selectedLessonId === "all") return false;
    const matchesSearch = item.word.includes(search) || item.meaning.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && item.lesson_id === selectedLessonId;
  });

  const handleOpenDetailed = (p: Phrase) => {
    setCurrentCharIndex(0);
    setDetailedPhrase(p);
  };

  useEffect(() => {
    if (detailedPhrase && writerContainerRef.current) {
      writerContainerRef.current.innerHTML = '';
      const characters = detailedPhrase.word.split('');
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
    }
  }, [detailedPhrase, currentCharIndex]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Câu Giao Tiếp Tiếng Trung</h1>
        <p className={styles.subtitle}>Tập trung vào các mẫu câu ngắn, thông dụng trong đời sống.</p>
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
          <input type="text" placeholder="Tìm kiếm mẫu câu..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className={styles.actionBtns}>
          <button className={styles.addBtn} style={{background:'#1ea362', color:'white'}} onClick={handleExportExcel}>
            <FileUp size={20} /> Xuất Excel
          </button>
          <button className={styles.addBtn} style={{background:'var(--foreground)', color:'white'}} onClick={() => setShowImportModal(true)}>
            <LogIn size={20} /> Nhập Excel
          </button>
          <button className={styles.addBtn} onClick={handleOpenAddModal}>
            <Plus size={20} /> Thêm mẫu câu
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Đang tải dữ liệu...</div>
      ) : selectedLessonId === "all" ? (
        <div className={styles.emptyState}>
          <MessageCircle size={48} style={{opacity:0.2, marginBottom:'1rem'}} />
          <p>Hãy chọn một bài học từ Menu để bắt đầu luyện tập giao tiếp nhé!</p>
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
              {filteredPhrases.map((item, index) => (
                <tr key={item.id}>
                  <td className={styles.sttCell}>{index + 1}</td>
                  <td className={`${styles.wordCell} hanzi`} onClick={() => handleOpenDetailed(item)}>{item.word}</td>
                  <td className={styles.pinyinCell}>{item.pinyin}</td>
                  <td className={styles.meaningCell}>{item.meaning}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.iconGroup}>
                      <button className={styles.iconBtn} onClick={() => speak(item.word)}><Play size={16} /></button>
                      <button className={styles.iconBtn} onClick={() => handleOpenDetailed(item)}><Edit2 size={16} /></button>
                      <button className={styles.iconBtn} onClick={() => handleDeletePhrase(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPhrases.length === 0 && <div className={styles.emptyState}>Buổi học này hiện chưa có mẫu câu nào.</div>}
        </div>
      )}

      {/* Add Phrase Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.detailModal} style={{maxWidth:'600px', padding:'2rem'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
              <h2>Thêm mẫu câu mới</h2>
              <X className={styles.closeBtn} onClick={() => setShowAddModal(false)} />
            </div>
            
            <div className={styles.formGroup} style={{marginBottom:'1rem'}}>
              <label>Gõ Pinyin gợi ý</label>
              <input type="text" className={styles.formInput} placeholder="Ví dụ: nihao" value={pinyinInput} onChange={e => setPinyinInput(e.target.value)} />
            </div>
            {pinyinInput && <HanziSuggester pinyin={pinyinInput} onSelect={handleSelectSuggestion} />}

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div className={styles.formGroup}>
                <label>Hán tự *</label>
                <input type="text" className={styles.formInput} value={newPhrase.word} onChange={e => setNewPhrase({...newPhrase, word: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Pinyin *</label>
                <input type="text" className={styles.formInput} value={newPhrase.pinyin} onChange={e => setNewPhrase({...newPhrase, pinyin: e.target.value})} />
              </div>
            </div>

            <div className={styles.formGroup} style={{marginTop:'1rem'}}>
              <label>Nghĩa Việt *</label>
              <input type="text" className={styles.formInput} value={newPhrase.meaning} onChange={e => setNewPhrase({...newPhrase, meaning: e.target.value})} />
            </div>

            <div className={styles.formGroup} style={{marginTop:'1rem', marginBottom:'2rem'}}>
              <label>Thuộc buổi học *</label>
              <select className={styles.formInput} value={newPhrase.lesson_id} onChange={e => setNewPhrase({...newPhrase, lesson_id: e.target.value})}>
                <option value="">-- Chọn buổi học --</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <button className={styles.saveBtn} style={{width:'100%'}} onClick={handleSaveNewPhrase}>Lưu mẫu câu</button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.detailModal} style={{maxWidth:'500px', padding:'2rem'}} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom:'1rem'}}>Nhập thông minh câu giao tiếp</h2>
            <div style={{background:'rgba(14, 165, 233, 0.1)', padding:'1rem', borderRadius:'8px', marginBottom:'1.5rem', borderLeft:'4px solid var(--primary)'}}>
              <p style={{fontSize:'0.9rem', margin:0}}>
                <b>Chỉ cần Excel 1 cột:</b> Điền <b>Câu Hán tự</b> ở cột đầu tiên.<br/>
                <i>Hệ thống tự điền Pinyin và Nghĩa Việt!</i>
              </p>
            </div>
            {selectedLessonId === "all" ? (
              <p style={{color:'red', fontWeight:700}}>Vui lòng chọn bài tập trước khi nhập!</p>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                <p>Đang nhập vào: <b>{lessons.find(l => l.id === selectedLessonId)?.name}</b></p>
                <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImportExcel} style={{display:'none'}} />
                <button className={styles.saveBtn} style={{background:'#1ea362'}} onClick={() => fileInputRef.current?.click()}>Chọn file Excel và Bắt đầu</button>
              </div>
            )}
            <button style={{marginTop:'1.5rem', width:'100%', padding:'0.8rem'}} onClick={() => setShowImportModal(false)}>Hủy bỏ</button>
          </div>
        </div>
      )}

      {/* Detailed Phrase Modal */}
      {detailedPhrase && (
        <div className={styles.modalOverlay} onClick={() => setDetailedPhrase(null)}>
          <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
            <div className={styles.detailContent}>
              <div className={styles.hanziSection}>
                <div ref={writerContainerRef} className={styles.writerContainer}></div>
                <div className={styles.charTabs}>
                  {detailedPhrase.word.split('').map((char, index) => (
                    <button key={index} className={`${styles.charTab} ${currentCharIndex === index ? styles.activeCharTab : ''} hanzi`} onClick={(e) => { e.stopPropagation(); setCurrentCharIndex(index); }}>{char}</button>
                  ))}
                </div>
                <div className={styles.modalControls}>
                  <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setCurrentCharIndex(0); writerInstance.current?.animateCharacter(); }}><Play size={14} style={{marginRight: '5px'}} /> Vẽ lại</button>
                </div>
              </div>
              <div className={styles.infoSection}>
                <div className={styles.mainInfo}>
                  <h2 className="hanzi" style={{fontSize:'2.5rem', color:'var(--primary)'}}>{detailedPhrase.word}</h2>
                  <p style={{fontSize:'1.5rem', color:'var(--text-muted)'}}>{detailedPhrase.pinyin}</p>
                  <p style={{fontSize:'1.25rem'}}>{detailedPhrase.meaning}</p>
                </div>
              </div>
            </div>
            <button style={{padding:'1rem', background:'rgba(0,0,0,0.05)', fontWeight:700}} onClick={() => setDetailedPhrase(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Play, Plus, X, Edit2, Trash2, BookOpen, MessageCircle, Save } from "lucide-react";
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
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");

      const { data: dbPhrases, error } = await supabase.from("phrases").select("*");
      const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");

      let finalLessons = [...(dbLessons || [])];
      let finalPhrases: Phrase[] = [];

      if (!error && dbPhrases) {
        finalPhrases = dbPhrases;
      }

      if (currentUser) {
        let migrationHappened = false;
        for (const localL of localLessons) {
          if (!finalLessons.some(dbL => dbL.name === localL.name)) {
            const { data: newL } = await supabase.from("lessons").insert({ name: localL.name, user_id: currentUser.id }).select().single();
            if (newL) {
              finalLessons.push(newL);
              localPhrases.forEach((p: any) => { if (p.lesson_id === localL.id) p.lesson_id = newL.id; });
              migrationHappened = true;
            }
          }
        }

        for (const localP of localPhrases) {
          if (!finalPhrases.some(dbP => dbP.word === localP.word)) {
            const { error: pErr } = await supabase.from("phrases").insert({
              word: localP.word,
              pinyin: localP.pinyin,
              meaning: localP.meaning,
              lesson_id: localP.lesson_id,
              user_id: currentUser.id
            });
            if (!pErr) migrationHappened = true;
          }
        }

        if (migrationHappened) {
          localStorage.removeItem("user_lessons");
          localStorage.removeItem("user_phrases");
          const { data: refreshed } = await supabase.from("phrases").select("*");
          finalPhrases = refreshed || [];
        }
      } else {
        finalLessons = [...finalLessons, ...localLessons];
        finalPhrases = [...finalPhrases, ...localPhrases];
      }

      setLessons(finalLessons);
      setPhrases(finalPhrases);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewPhrase = async () => {
    if (!newPhrase.word || !newPhrase.meaning || !newPhrase.lesson_id) {
      alert("Vui lòng nhập đầy đủ câu Hán tự, Nghĩa và chọn Buổi học!");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase.from("phrases").insert({
        ...newPhrase,
        user_id: session.user.id
      }).select().single();

      if (!error && data) {
        setPhrases(prev => [...prev, data]);
        setShowAddModal(false);
        setNewPhrase({ word: "", pinyin: "", meaning: "", lesson_id: "" });
        alert("Đã lưu lên Cloud!");
      }
    } else {
      const phraseToAdd: Phrase = { ...newPhrase, id: `phrase-${Date.now()}` };
      const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");
      localStorage.setItem("user_phrases", JSON.stringify([...localPhrases, phraseToAdd]));
      setPhrases(prev => [...prev, phraseToAdd]);
      setShowAddModal(false);
      alert("Đã lưu tạm trên máy!");
    }
  };

  const handleUpdatePhraseInfo = async () => {
    if (!detailedPhrase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !detailedPhrase.id.startsWith("phrase-")) {
      const { error } = await supabase.from("phrases").update({
        word: detailedPhrase.word,
        pinyin: detailedPhrase.pinyin,
        meaning: detailedPhrase.meaning
      }).eq("id", detailedPhrase.id);
      if (error) alert(error.message);
    } else {
      const local = JSON.parse(localStorage.getItem("user_phrases") || "[]");
      const updated = local.map((p: any) => p.id === detailedPhrase.id ? detailedPhrase : p);
      localStorage.setItem("user_phrases", JSON.stringify(updated));
    }
    setPhrases(prev => prev.map(p => p.id === detailedPhrase.id ? detailedPhrase : p));
    alert("Đã cập nhật!");
  };

  const handleDeletePhrase = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu giao tiếp này?")) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !id.startsWith("phrase-")) {
      const { error } = await supabase.from("phrases").delete().eq("id", id);
      if (error) {
        alert("Lỗi khi xóa trên Cloud: " + error.message);
        return;
      }
    } else {
      const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");
      const updated = localPhrases.filter((p: any) => p.id !== id);
      localStorage.setItem("user_phrases", JSON.stringify(updated));
    }
    setPhrases(prev => prev.filter(p => p.id !== id));
    alert("Đã xóa câu giao tiếp!");
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Tìm giọng đọc Trung Quốc tốt nhất có sẵn trên thiết bị
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes("zh") || v.lang.includes("CN") || v.lang.includes("TW"));
    if (zhVoice) utterance.voice = zhVoice;
    
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    utterance.volume = 1;
    
    // Fix cho một số trình duyệt di động cần tương tác người dùng
    window.speechSynthesis.speak(utterance);
  };

  const handleAddLesson = async () => {
    const name = prompt("Nhập tên buổi tập mới:");
    if (!name) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase.from("lessons").insert({ name, user_id: session.user.id }).select().single();
      if (!error && data) {
        setLessons(prev => [...prev, data]);
        setSelectedLessonId(data.id);
      }
    } else {
      const newLesson = { id: `lesson-${Date.now()}`, name };
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      localStorage.setItem("user_lessons", JSON.stringify([...localLessons, newLesson]));
      setLessons(prev => [...prev, newLesson]);
      setSelectedLessonId(newLesson.id);
    }
  };

  const handleDeleteLesson = async () => {
    if (selectedLessonId === "all") return;
    const lessonName = lessons.find(l => l.id === selectedLessonId)?.name;
    if (!confirm(`Xóa "${lessonName}" và tất cả câu giao tiếp bên trong?`)) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !selectedLessonId.startsWith("lesson-")) {
      await supabase.from("lessons").delete().eq("id", selectedLessonId);
    } else {
      const localL = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      localStorage.setItem("user_lessons", JSON.stringify(localL.filter((l: any) => l.id !== selectedLessonId)));
      const localP = JSON.parse(localStorage.getItem("user_phrases") || "[]");
      localStorage.setItem("user_phrases", JSON.stringify(localP.filter((p: any) => p.lesson_id !== selectedLessonId)));
    }
    
    setLessons(prev => prev.filter(l => l.id !== selectedLessonId));
    setPhrases(prev => prev.filter(p => p.lesson_id !== selectedLessonId));
    setSelectedLessonId("all");
    alert("Đã xóa thành công!");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedLessonId === "all") {
      alert("Vui lòng chọn một bài học cụ thể!");
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

        if (!data || data.length === 0) return;

        const { data: { session } } = await supabase.auth.getSession();
        const firstCell = String(data[0]?.[0] || "").toLowerCase();
        const startIdx = (firstCell.includes("hán") || firstCell.includes("câu")) ? 1 : 0;

        for (let i = startIdx; i < data.length; i++) {
          const row = data[i];
          const hanzi = String(row[0] || "").trim();
          if (!hanzi || hanzi === "undefined") continue;

          if (phrases.some(p => p.word === hanzi)) continue;

          const py = pinyin(hanzi, { toneType: 'symbol' }).replace(/\s+/g, '');
          let meaning = "";
          try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(hanzi)}`);
            const transData = await res.json();
            meaning = transData?.[0]?.[0]?.[0] || "";
          } catch {
            meaning = hanzi.split('').map(c => HAN_VIET_DATA[c] || c).join(' ');
          }

          if (session?.user && !selectedLessonId.startsWith("lesson-")) {
            await supabase.from("phrases").insert({ word: hanzi, pinyin: py, meaning, lesson_id: selectedLessonId, user_id: session.user.id });
          } else {
            const phraseToAdd = { id: `phrase-excel-${Date.now()}-${i}`, word: hanzi, pinyin: py, meaning, lesson_id: selectedLessonId };
            const local = JSON.parse(localStorage.getItem("user_phrases") || "[]");
            localStorage.setItem("user_phrases", JSON.stringify([...local, phraseToAdd]));
          }
        }
        fetchData();
        setShowImportModal(false);
        alert("Nhập Excel hoàn tất!");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    if (filteredPhrases.length === 0) return;
    const dataToExport = filteredPhrases.map((item, index) => ({
      "STT": index + 1, "Hán tự": item.word, "Pinyin": item.pinyin, "Nghĩa Việt": item.meaning
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GiaoTiep");
    XLSX.writeFile(workbook, `GiaoTiep_${new Date().toLocaleDateString()}.xlsx`);
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
        width: 250, height: 250, padding: 5, strokeColor: '#0ea5e9', showOutline: true
      });
      writerInstance.current.animateCharacter();
    }
  }, [detailedPhrase, currentCharIndex]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Câu Giao Tiếp Tiếng Trung</h1>
        <p className={styles.subtitle}>Đồng bộ hóa Cloud và luyện tập mọi lúc mọi nơi.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterSection}>
          <label style={{fontWeight:700}}>Buổi học:</label>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <select className={styles.lessonSelect} value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)}>
              <option value="all">--- Chọn buổi học ---</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button className={styles.iconBtn} onClick={handleAddLesson} style={{background:'var(--primary)', color:'white'}}><Plus size={20} /></button>
            {selectedLessonId !== "all" && (
              <button className={styles.iconBtn} onClick={handleDeleteLesson} style={{background:'#ef4444', color:'white'}}><Trash2 size={18} /></button>
            )}
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input type="text" placeholder="Tìm kiếm câu..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className={styles.actionBtns}>
          <button className={styles.addBtn} style={{background:'#1ea362', color:'white'}} onClick={handleExportExcel}><FileUp size={20} /> Xuất Excel</button>
          <button className={styles.addBtn} style={{background:'var(--foreground)', color:'white'}} onClick={() => setShowImportModal(true)}><LogIn size={20} /> Nhập Excel</button>
          <button className={styles.addBtn} onClick={handleOpenAddModal}><Plus size={20} /> Thêm câu</button>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Đang tải...</div>
      ) : selectedLessonId === "all" ? (
        <div className={styles.emptyState}>
          <MessageCircle size={48} style={{opacity:0.2, marginBottom:'1rem'}} />
          <p>Hãy chọn một bài học để bắt đầu nhé!</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.vocabTable}>
            <thead>
              <tr><th className={styles.sttCell}>STT</th><th>Hán tự</th><th>Pinyin</th><th>Nghĩa</th><th className={styles.actionCell}>Thao tác</th></tr>
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
        </div>
      )}

      {/* Add Modal */}
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
            {pinyinInput && <HanziSuggester pinyin={pinyinInput} onSelect={(char, acc) => setNewPhrase({...newPhrase, word: char, pinyin: acc.replace(/\s+/g, '')})} />}

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div className={styles.formGroup}><label>Hán tự *</label><input type="text" className={styles.formInput} value={newPhrase.word} onChange={e => setNewPhrase({...newPhrase, word: e.target.value})} /></div>
              <div className={styles.formGroup}><label>Pinyin *</label><input type="text" className={styles.formInput} value={newPhrase.pinyin} onChange={e => setNewPhrase({...newPhrase, pinyin: e.target.value})} /></div>
            </div>
            <div className={styles.formGroup} style={{marginTop:'1rem'}}><label>Nghĩa Việt *</label><input type="text" className={styles.formInput} value={newPhrase.meaning} onChange={e => setNewPhrase({...newPhrase, meaning: e.target.value})} /></div>
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
            <h2>Nhập câu giao tiếp từ Excel</h2>
            <div style={{background:'rgba(14, 165, 233, 0.1)', padding:'1rem', borderRadius:'8px', margin:'1rem 0'}}>
              <p style={{fontSize:'0.9rem'}}>Chỉ cần Excel 1 cột chứa <b>Câu Hán tự</b>. Hệ thống tự điền Pinyin và Nghĩa!</p>
            </div>
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImportExcel} style={{display:'none'}} />
            <button className={styles.saveBtn} style={{width:'100%'}} onClick={() => fileInputRef.current?.click()}>Chọn file Excel</button>
            <button style={{marginTop:'1rem', width:'100%'}} onClick={() => setShowImportModal(false)}>Hủy</button>
          </div>
        </div>
      )}

      {/* Detailed Modal (Edit Info) */}
      {detailedPhrase && (
        <div className={styles.modalOverlay} onClick={() => setDetailedPhrase(null)}>
          <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
            <div className={styles.detailContent}>
              <div className={styles.hanziSection}>
                <div ref={writerContainerRef} className={styles.writerContainer}></div>
                <div className={styles.charTabs}>
                  {detailedPhrase.word.split('').map((char, index) => (
                    <button key={index} className={`${styles.charTab} ${currentCharIndex === index ? styles.activeCharTab : ''} hanzi`} onClick={() => setCurrentCharIndex(index)}>{char}</button>
                  ))}
                </div>
              </div>
              <div className={styles.infoSection}>
                <div className={styles.mainInfo}>
                  <div className={styles.formGroup}><label>Hán tự</label><input type="text" className={`${styles.formInput} hanzi`} style={{fontSize:'1.8rem'}} value={detailedPhrase.word} onChange={e => setDetailedPhrase({...detailedPhrase, word: e.target.value})} /></div>
                  <div className={styles.formGroup}><label>Pinyin</label><input type="text" className={styles.formInput} value={detailedPhrase.pinyin} onChange={e => setDetailedPhrase({...detailedPhrase, pinyin: e.target.value})} /></div>
                  <div className={styles.formGroup}><label>Nghĩa Việt</label><input type="text" className={styles.formInput} value={detailedPhrase.meaning} onChange={e => setDetailedPhrase({...detailedPhrase, meaning: e.target.value})} /></div>
                  <button className={styles.saveBtn} style={{marginTop:'1rem'}} onClick={handleUpdatePhraseInfo}><Save size={18} style={{marginRight:'0.5rem'}} /> Lưu thay đổi</button>
                </div>
              </div>
            </div>
            <button style={{padding:'1rem', width:'100%', fontWeight:700}} onClick={() => setDetailedPhrase(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

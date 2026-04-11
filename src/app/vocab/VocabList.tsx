"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Volume2, Plus, X, Edit2, Trash2, BookOpen, Save, FileUp, LogIn } from "lucide-react";
import styles from "./vocab.module.css";
import HanziWriter from "hanzi-writer";
import { supabase } from "@/lib/supabase";
import HanziSuggester from "@/components/HanziSuggester";
import { HAN_VIET_DATA } from "@/lib/han-viet";
import * as XLSX from "xlsx";
import { pinyin } from "pinyin-pro";
import { isAdmin } from "@/lib/auth-utils";

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  word_type: string;
  lesson_id: string;
  lesson?: string;
}

const WORD_TYPES = [
  { label: "Danh từ (N)",       abbr: "N" },
  { label: "Động từ (V)",       abbr: "V" },
  { label: "Tính từ (Adj)",     abbr: "Adj" },
  { label: "Phó từ",            abbr: "Phó từ" },
  { label: "Đại từ",            abbr: "Đại từ" },
  { label: "Lượng từ",          abbr: "Lượng từ" },
  { label: "Số từ",             abbr: "Số từ" },
  { label: "Giới từ",           abbr: "Giới từ" },
  { label: "Liên từ",           abbr: "Liên từ" },
  { label: "Trợ từ",            abbr: "Trợ từ" },
  { label: "Thán từ",           abbr: "Thán từ" },
  { label: "Từ khu biệt",       abbr: "Từ khu biệt" },
  { label: "Từ trạng thái",     abbr: "Từ trạng thái" },
  { label: "Từ tượng thanh",    abbr: "Từ tượng thanh" },
];

export default function VocabList() {
  const [search, setSearch] = useState("");
  const [vocab, setVocab] = useState<Word[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [detailedWord, setDetailedWord] = useState<Word | null>(null);
  
  const [newWord, setNewWord] = useState({ 
    word: "", pinyin: "", meaning: "", word_type: "", lesson_id: "" 
  });
  const [pinyinInput, setPinyinInput] = useState("");

  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const writerContainerRef = useRef<HTMLDivElement>(null);
  const writerInstance = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setNewWord({ 
      word: "", pinyin: "", meaning: "", word_type: "",
      lesson_id: selectedLessonId === "all" ? "" : selectedLessonId
    });
    setPinyinInput("");
    setShowAddModal(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, setter: (val: string) => void, currentVal: string) => {
    if (e.key === 'Enter') {
      const cursorPosition = e.currentTarget.selectionStart;
      const textBeforeCursor = currentVal.substring(0, cursorPosition);
      const lines = textBeforeCursor.split('\n');
      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/^(\d+)\.\s/);
      if (match) {
        e.preventDefault();
        const nextNumber = parseInt(match[1]) + 1;
        const insertText = `\n${nextNumber}. `;
        const newText = currentVal.substring(0, cursorPosition) + insertText + currentVal.substring(cursorPosition);
        setter(newText);
        const newPos = cursorPosition + insertText.length;
        setTimeout(() => {
          const textarea = e.target as HTMLTextAreaElement;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    }
  };

  const handleSelectSuggestion = async (char: string, accented: string) => {
    setNewWord(prev => ({ 
      ...prev, 
      word: char, 
      pinyin: accented.replace(/\s+/g, ''),
    }));
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(char)}`);
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        setNewWord(prev => ({ ...prev, meaning: data[0][0][0] }));
      } else {
        const hv = char.split('').map(c => HAN_VIET_DATA[c] || c).join(' ');
        setNewWord(prev => ({ ...prev, meaning: hv }));
      }
    } catch (err) {
      const hv = char.split('').map(c => HAN_VIET_DATA[c] || c).join(' ');
      setNewWord(prev => ({ ...prev, meaning: hv }));
    }
  };

  useEffect(() => {
    if (detailedWord && writerContainerRef.current) {
      writerContainerRef.current.innerHTML = '';
      const characters = detailedWord.word.match(/[\u4e00-\u9fa5]/g) || [];
      if (characters.length > 0) {
        const charToDraw = (characters[currentCharIndex] || characters[0]) as string;
        const width = writerContainerRef.current.clientWidth;
        writerInstance.current = HanziWriter.create(writerContainerRef.current, charToDraw, {
          width: width, height: width, padding: 5, strokeColor: '#0ea5e9',
          outlineColor: '#eee', drawingColor: '#333', showOutline: true, delayBetweenLoops: 1000
        });
        writerInstance.current.animateCharacter({
          onComplete: () => {
            if (currentCharIndex < characters.length - 1) {
              setTimeout(() => setCurrentCharIndex(prev => prev + 1), 500);
            }
          }
        });
      }
    }
  }, [detailedWord, currentCharIndex]);

  const handleOpenDetailed = (word: Word) => {
    setCurrentCharIndex(0);
    setDetailedWord(word);
  };

  const sortLessons = (lessonList: any[]) => {
    return [...lessonList].sort((a, b) => {
      const numA = a.name.match(/\d+/);
      const numB = b.name.match(/\d+/);
      
      if (numA && numB) return parseInt(numA[0]) - parseInt(numB[0]);
      if (numA) return -1;
      if (numB) return 1;
      
      const getTime = (item: any) => {
        if (item.created_at) return new Date(item.created_at).getTime();
        const match = String(item.id || "").match(/lesson-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      return getTime(a) - getTime(b);
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      const { data: dbVocab, error } = await supabase.from("vocab").select("*, lessons(name, id)").order("created_at", { ascending: true });
      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      let finalLessons = [...(dbLessons || [])];
      let finalVocab: Word[] = [];
      if (!error && dbVocab) {
        finalVocab = dbVocab.map((item: any) => ({
          ...item, word_type: item.word_type || "", lesson: item.lessons?.name || "Kho chung", lesson_id: item.lesson_id
        }));
      }
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || null;
      setUserEmail(email);
      if (session?.user) {
        finalLessons = [...finalLessons];
      } else {
        finalLessons = [...finalLessons, ...localLessons];
        finalVocab = [...finalVocab, ...localVocab];
      }
      setLessons(sortLessons(finalLessons));
      setVocab(finalVocab);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Lưu lại selectedLessonId tại thời điểm này để không bị mất sau async
    const currentLessonId = selectedLessonId;
    if (!file || currentLessonId === "all") {
      alert("Vui lòng chọn một buổi học cụ thể trước khi nhập!"); return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const dataBuffer = evt.target?.result;
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (!data || data.length === 0) return;
        const { data: { session } } = await supabase.auth.getSession();
        const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
        // Chỉ so sánh trùng trong cùng buổi học hiện tại
        const currentLessonVocab = [...vocab, ...localVocab].filter(v => v.lesson_id === currentLessonId);
        let updatedLocal = [...localVocab];
        let addedVocab: Word[] = [];
        let addedCount = 0;
        let skippedCount = 0;
        const firstCell = String(data[0]?.[0] || "").toLowerCase();
        const startIdx = (firstCell.includes("hán") || firstCell.includes("stt") || firstCell.includes("word")) ? 1 : 0;
        for (let i = startIdx; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;
          // Tìm chữ Hán trong bất kỳ cột nào của hàng
          let hanzi = "";
          for (const cell of row) {
            const cellStr = String(cell || "").trim();
            if (/[\u4e00-\u9fa5]/.test(cellStr)) { hanzi = cellStr; break; }
          }
          if (!hanzi || hanzi === "undefined") continue;
          // Chỉ bỏ qua nếu từ đã tồn tại trong CÙNG buổi học
          if (currentLessonVocab.some(v => v.word === hanzi)) { skippedCount++; continue; }
          const py = pinyin(hanzi, { toneType: 'symbol' }).replace(/\s+/g, '');
          let meaning = "";
          try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(hanzi)}`);
            const transData = await res.json();
            meaning = transData?.[0]?.[0]?.[0] || "";
          } catch { meaning = hanzi.split('').map(c => HAN_VIET_DATA[c] || c).join(' '); }
          if (session?.user && isAdmin(session.user.email) && !currentLessonId.startsWith("lesson-")) {
            // Admin và lesson từ Cloud: insert vào Supabase
            const { data: dbItem, error: insertErr } = await supabase.from("vocab").insert({
              word: hanzi, pinyin: py, meaning: meaning, word_type: "", lesson_id: currentLessonId, user_id: session.user.id
            }).select().single();
            if (dbItem && !insertErr) {
              addedVocab.push({ ...dbItem, lesson: lessons.find(l => l.id === currentLessonId)?.name });
              addedCount++;
            } else {
              // Fallback vào localStorage nếu Supabase lỗi
              const nw: Word = { id: `excel-${Date.now()}-${i}`, word: hanzi, pinyin: py, meaning, word_type: "", lesson_id: currentLessonId, lesson: lessons.find(l => l.id === currentLessonId)?.name };
              updatedLocal.push(nw);
              addedVocab.push(nw);
              addedCount++;
            }
          } else {
            // Guest hoặc lesson localStorage: lưu local
            const nw: Word = { id: `excel-${Date.now()}-${i}`, word: hanzi, pinyin: py, meaning, word_type: "", lesson_id: currentLessonId, lesson: lessons.find(l => l.id === currentLessonId)?.name };
            updatedLocal.push(nw);
            addedVocab.push(nw);
            addedCount++;
          }
        }
        if (updatedLocal.length > localVocab.length) {
          localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
        }
        if (addedVocab.length > 0) {
          setVocab(prev => [...prev, ...addedVocab]);
        }
        // Đóng modal trước khi alert để không mất selectedLessonId
        setShowImportModal(false);
        setSelectedLessonId(currentLessonId); // Đảm bảo giữ buổi học hiện tại
        const msg = skippedCount > 0
          ? `Đã nhập ${addedCount} từ! (Bỏ qua ${skippedCount} từ trùng trong buổi này)`
          : `Đã nhập xong ${addedCount} từ!`;
        setTimeout(() => alert(msg), 100); // Delay nhỏ để React cập nhật state trước
      } catch (err) { console.error(err); alert("Lỗi khi nhập file Excel!"); } finally { setLoading(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveNewWord = async () => {
    if (!newWord.word || !newWord.meaning || !newWord.lesson_id) {
      alert("Vui lòng điền đủ thông tin!"); return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase.from("vocab").insert({ ...newWord, user_id: session.user.id }).select().single();
      if (!error && data) {
        setVocab(prev => [...prev, { ...data, lesson: lessons.find(l => l.id === data.lesson_id)?.name }]);
        setShowAddModal(false);
        setNewWord({ word: "", pinyin: "", meaning: "", word_type: "", lesson_id: selectedLessonId });
        setPinyinInput("");
        alert("Đã lưu thành công!");
      }
    } else {
      const wordToAdd: Word = { ...newWord, id: `local-${Date.now()}`, lesson: lessons.find(l => l.id === newWord.lesson_id)?.name };
      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      localStorage.setItem("user_vocab", JSON.stringify([...localVocab, wordToAdd]));
      setVocab(prev => [...prev, wordToAdd]);
      setShowAddModal(false);
      setNewWord({ word: "", pinyin: "", meaning: "", word_type: "", lesson_id: selectedLessonId });
      setPinyinInput("");
      alert("Đã lưu Local!");
    }
  };

  const handleUpdateWordInfo = async () => {
    if (!detailedWord) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !detailedWord.id.startsWith("local-") && !detailedWord.id.startsWith("excel-")) {
      const { error } = await supabase.from("vocab").update({ 
        word: detailedWord.word, pinyin: detailedWord.pinyin, meaning: detailedWord.meaning, word_type: detailedWord.word_type 
      }).eq("id", detailedWord.id);
      if (error) { alert(error.message); return; }
    } else {
      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      const updatedLocal = localVocab.map((v: any) => v.id === detailedWord.id ? detailedWord : v);
      localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
    }
    setVocab(prev => prev.map(v => v.id === detailedWord.id ? detailedWord : v));
    alert("Đã cập nhật!");
  };

  const handleDeleteWord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa từ này?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !id.startsWith("local-") && !id.startsWith("excel-")) {
      await supabase.from("vocab").delete().eq("id", id);
    }
    const localData = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    localStorage.setItem("user_vocab", JSON.stringify(localData.filter((v: any) => v.id !== id)));
    setVocab(prev => prev.filter(v => v.id !== id));
    if (detailedWord?.id === id) setDetailedWord(null);
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN"; utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleAddLesson = async () => {
    const name = prompt("Tên buổi học:");
    if (!name) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Admin: tạo lesson trực tiếp trên Supabase để có UUID hợp lệ
      const { data, error } = await supabase.from("lessons").insert({ name, user_id: session.user.id }).select().single();
      if (!error && data) {
        setLessons(prev => sortLessons([...prev, data]));
        setSelectedLessonId(data.id);
      } else {
        alert("Lỗi tạo buổi học: " + (error?.message || "Không rõ"));
      }
    } else {
      const nl = { id: `lesson-${Date.now()}`, name };
      const local = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      localStorage.setItem("user_lessons", JSON.stringify([...local, nl]));
      setLessons(prev => sortLessons([...prev, nl]));
      setSelectedLessonId(nl.id);
    }
  };

  const handleDeleteLesson = async () => {
    if (selectedLessonId === "all" || !confirm("Xóa cả buổi và từ vựng?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !selectedLessonId.startsWith("lesson-")) {
      const { error } = await supabase.from("lessons").delete().eq("id", selectedLessonId);
      if (error) { alert("Lỗi xóa Cloud: " + error.message); return; }
    }
    const localL = JSON.parse(localStorage.getItem("user_lessons") || "[]");
    localStorage.setItem("user_lessons", JSON.stringify(localL.filter((l: any) => l.id !== selectedLessonId)));
    setLessons(prev => prev.filter(l => l.id !== selectedLessonId));
    const localV = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    const filteredV = localV.filter((v: any) => v.lesson_id !== selectedLessonId);
    localStorage.setItem("user_vocab", JSON.stringify(filteredV));
    setVocab(prev => prev.filter(v => v.lesson_id !== selectedLessonId));
    setSelectedLessonId("all");
    alert("Đã xóa dứt điểm!");
  };

  const handleExportExcel = () => {
    const data = filteredVocab.map((item, index) => ({
      "STT": index + 1, "Hán tự": item.word, "Pinyin": item.pinyin, "Nghĩa Việt": item.meaning, "Loại từ": item.word_type || ""
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TuVung");
    XLSX.writeFile(wb, `TuVung_${new Date().toLocaleDateString()}.xlsx`);
  };

  const filteredVocab = vocab.filter(item => {
    const matches = item.word.includes(search) || item.meaning.toLowerCase().includes(search.toLowerCase()) || item.pinyin.toLowerCase().includes(search.toLowerCase());
    return search.trim() !== "" ? matches : (selectedLessonId === "all" ? false : item.lesson_id === selectedLessonId);
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Từ vựng Tiếng Trung</h1>
        <p className={styles.subtitle}>Tập trung học từ và viết chữ.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterSection}>
          <label style={{fontWeight:700}}>Buổi học:</label>
          <div style={{display:'flex', gap:'0.5rem'}}>
            <select className={styles.lessonSelect} value={selectedLessonId} onChange={(e) => setSelectedLessonId(e.target.value)}>
              <option value="all">--- Chọn buổi ---</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button className={styles.iconBtn} onClick={handleAddLesson} style={{background:'var(--primary)', color:'white'}}><Plus size={20} /></button>
            {selectedLessonId !== "all" && isAdmin(userEmail) && <button className={styles.iconBtn} onClick={handleDeleteLesson} style={{background:'#ef4444', color:'white'}}><Trash2 size={18} /></button>}
          </div>
        </div>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className={styles.actionBtns}>
          <button className={styles.addBtn} style={{background:'#1ea362', color:'white'}} onClick={handleExportExcel}><FileUp size={20} /> Xuất</button>
          <button className={styles.addBtn} style={{background:'var(--foreground)', color:'white'}} onClick={() => setShowImportModal(true)}><LogIn size={20} /> Nhập</button>
          <button className={styles.addBtn} onClick={handleOpenAddModal}><Plus size={20} /> Thêm mới</button>
        </div>
      </div>

      {loading ? (<div className={styles.emptyState}>Đang tải...</div>) : selectedLessonId === "all" ? (
        <div className={styles.emptyState}><BookOpen size={48} style={{opacity:0.2, marginBottom:'1rem'}} /><p>Chọn bài học để bắt đầu!</p></div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.vocabTable}>
            <thead><tr><th className={styles.sttCell}>STT</th><th>Hán tự</th><th>Pinyin</th><th>Loại từ</th><th>Nghĩa Việt</th><th className={styles.actionCell}>Thao tác</th></tr></thead>
            <tbody>
              {filteredVocab.map((item, index) => (
                <tr key={item.id}>
                  <td className={styles.sttCell}>{index + 1}</td>
                  <td className={`${styles.wordCell} hanzi`} onClick={() => handleOpenDetailed(item)}>{item.word}</td>
                  <td className={styles.pinyinCell}>{item.pinyin}</td>
                  <td><span className={styles.typeCell}>{WORD_TYPES.find(t => t.abbr === item.word_type || t.label === item.word_type)?.abbr || item.word_type}</span></td>
                  <td className={styles.meaningCell}>{item.meaning}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.iconGroup}>
                      <button className={styles.iconBtn} onClick={() => speak(item.word)} title="Nghe phát âm"><Volume2 size={16} /></button>
                      {(isAdmin(userEmail) || item.id.startsWith("local-") || item.id.startsWith("excel-")) && (
                        <><button className={styles.iconBtn} onClick={() => handleOpenDetailed(item)}><Edit2 size={16} /></button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={(e) => handleDeleteWord(item.id, e)}><Trash2 size={16} /></button></>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.detailModal} style={{maxWidth:'600px', display:'flex', flexDirection:'column', maxHeight:'90vh'}} onClick={e => e.stopPropagation()}>
            <div style={{padding:'1.5rem 2rem 0.5rem 2rem'}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}><h2 style={{margin:0}}>Thêm từ vựng</h2><X style={{cursor:'pointer'}} onClick={() => setShowAddModal(false)} /></div></div>
            <div style={{flex:1, overflowY:'auto', padding:'0 2rem 1.5rem 2rem'}}>
              <div className={styles.formGroup}><label>Gợi ý từ Pinyin</label><input type="text" className={styles.formInput} value={pinyinInput} onChange={e => setPinyinInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveNewWord()} /></div>
              {pinyinInput && <HanziSuggester pinyin={pinyinInput} onSelect={handleSelectSuggestion} />}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'1rem'}}>
                <div className={styles.formGroup}><label>Hán tự</label><input type="text" className={styles.formInput} value={newWord.word} onChange={e => setNewWord({...newWord, word: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveNewWord()} /></div>
                <div className={styles.formGroup}><label>Pinyin</label><input type="text" className={styles.formInput} value={newWord.pinyin} onChange={e => setNewWord({...newWord, pinyin: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleSaveNewWord()} /></div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'1rem'}}>
                <div className={styles.formGroup}><label>Loại từ</label>
                  <select className={styles.formInput} value={newWord.word_type} onChange={e => setNewWord({...newWord, word_type: e.target.value})}>
                    <option value="">-- Chọn loại từ --</option>
                    {WORD_TYPES.map(t => (
                      <option key={t.abbr} value={t.abbr}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}><label>Nghĩa Việt</label><textarea className={styles.formInput} value={newWord.meaning} onChange={e => setNewWord({...newWord, meaning: e.target.value})} onKeyDown={e => handleKeyDown(e, (v)=>setNewWord({...newWord, meaning:v}), newWord.meaning)} /></div>
              </div>
              <div className={styles.formGroup} style={{marginTop:'1.5rem'}}><label>Buổi học</label><select className={styles.formInput} value={newWord.lesson_id} onChange={e => setNewWord({...newWord, lesson_id: e.target.value})}>
                <option value="">-- Chọn buổi học --</option>{lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
              </div>
            </div>
            <div style={{padding:'1rem 2rem', borderTop:'1px solid #eee', background:'white', borderBottomLeftRadius:'12px', borderBottomRightRadius:'12px'}}><button className={styles.saveBtn} style={{width:'100%', margin:0}} onClick={handleSaveNewWord}>Lưu từ vựng (Enter)</button></div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.detailModal} style={{maxWidth:'500px', display:'flex', flexDirection:'column', maxHeight:'90vh'}} onClick={e => e.stopPropagation()}>
            <div style={{padding:'2rem'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}><h2 style={{margin:0}}>Nhập từ Excel</h2><X style={{cursor:'pointer'}} onClick={() => setShowImportModal(false)} /></div>
              <div style={{background:'rgba(14, 165, 233, 0.1)', padding:'1rem', borderRadius:'12px', marginBottom:'1.5rem'}}><p style={{margin:0, fontSize:'0.9rem', color:'var(--primary)', fontWeight:600}}>💡 File chỉ cần 1 cột Hán tự, hệ thống tự điền Pinyin/Nghĩa!</p></div>
              <button className={styles.saveBtn} style={{width:'100%', marginBottom:'1rem'}} onClick={() => fileInputRef.current?.click()}>Chọn file .xlsx</button>
              <button style={{width:'100%', background:'transparent', border:'1px solid #eee', padding:'0.8rem', borderRadius:'10px'}} onClick={() => setShowImportModal(false)}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}

      {detailedWord && (
        <div className={styles.modalOverlay} onClick={() => setDetailedWord(null)}>
          <div className={styles.detailModal} onClick={e => e.stopPropagation()}>
            <div className={styles.detailContent}>
              <div className={styles.hanziSection}>
                <div ref={writerContainerRef} className={styles.writerContainer}></div>
                <div className={styles.charTabs}>{(detailedWord.word.match(/[\u4e00-\u9fa5]/g) || []).map((char, index) => (
                  <button key={index} className={`${styles.charTab} ${currentCharIndex === index ? styles.activeCharTab : ''} hanzi`} onClick={() => {setCurrentCharIndex(index); speak(char);}}>{char}</button>
                ))}</div>
                <div style={{display:'flex', gap:'0.5rem', marginTop:'1rem', justifyContent:'center'}}>
                  <button className={styles.iconBtn} onClick={() => {setCurrentCharIndex(0); writerInstance.current?.animateCharacter();}} title="Vẽ lại">Vẽ lại</button>
                  <button className={styles.iconBtn} onClick={() => speak(detailedWord.word)} title="Nghe phát âm" style={{background:'rgba(14,165,233,0.15)', color:'var(--primary)'}}><Volume2 size={20} /></button>
                </div>
              </div>
              <div className={styles.infoSection}>
                <div className={styles.formGroup}><label>Hán tự</label><textarea className={`${styles.formInput} hanzi`} value={detailedWord.word} onChange={e => setDetailedWord({...detailedWord, word: e.target.value})} /></div>
                <div className={styles.formGroup}><label>Pinyin</label><input type="text" className={styles.formInput} value={detailedWord.pinyin} onChange={e => setDetailedWord({...detailedWord, pinyin: e.target.value})} /></div>
                <div className={styles.formGroup}><label>Nghĩa Việt</label><textarea className={styles.formInput} value={detailedWord.meaning} onChange={e => setDetailedWord({...detailedWord, meaning: e.target.value})} onKeyDown={e => handleKeyDown(e, (v)=>setDetailedWord({...detailedWord, meaning:v}), detailedWord.meaning)} /></div>
                <div className={styles.formGroup}><label>Loại từ</label>
                  <select className={styles.formInput} value={detailedWord.word_type} onChange={e => setDetailedWord({...detailedWord, word_type: e.target.value})}>
                    <option value="">-- Chọn loại từ --</option>
                    {WORD_TYPES.map(t => (
                      <option key={t.abbr} value={t.abbr}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {(isAdmin(userEmail) || detailedWord.id.startsWith("local-") || detailedWord.id.startsWith("excel-")) && (
                  <><button className={styles.saveBtn} style={{width:'100%', marginTop:'1rem'}} onClick={handleUpdateWordInfo}><Save size={18} /> Lưu thay đổi</button>
                  <button className={styles.iconBtn} style={{background:'#ef4444', color:'white', width:'100%', marginTop:'0.5rem', justifyContent:'center'}} onClick={(e) => handleDeleteWord(detailedWord.id, e)}><Trash2 size={16} /></button></>
                )}
              </div>
            </div>
            <button style={{padding:'1rem', background:'rgba(0,0,0,0.05)', width:'100%'}} onClick={() => setDetailedWord(null)}>Đóng</button>
          </div>
        </div>
      )}

      <button className={styles.floatingAddBtn} onClick={handleOpenAddModal}><Plus size={28} /></button>
      <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".xlsx, .xls" onChange={handleImportExcel} />
    </div>
  );
}

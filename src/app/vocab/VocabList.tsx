"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Play, Plus, X, Edit2, Trash2, ChevronDown, BookOpen, Save, FileUp, LogIn } from "lucide-react";
import styles from "./vocab.module.css";
import HanziWriter from "hanzi-writer";
import { supabase } from "@/lib/supabase";
import HanziSuggester from "@/components/HanziSuggester";
import { HAN_VIET_DATA } from "@/lib/han-viet";
import * as XLSX from "xlsx";
import { pinyin } from "pinyin-pro";

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  word_type: string;
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
    word: "", pinyin: "", meaning: "", word_type: "", lesson_id: "", 
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
      word: "", pinyin: "", meaning: "", word_type: "",
      lesson_id: selectedLessonId === "all" ? "" : selectedLessonId, 
      example_cn: "", example_py: "", example_vi: "" 
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
      
      // Kiểm tra xem dòng cuối có bắt đầu bằng số (ví dụ: "1. ")
      const match = lastLine.match(/^(\d+)\.\s/);
      if (match) {
        e.preventDefault();
        const nextNumber = parseInt(match[1]) + 1;
        const insertText = `\n${nextNumber}. `;
        
        const newText = currentVal.substring(0, cursorPosition) + insertText + currentVal.substring(cursorPosition);
        setter(newText);
        
        // Đặt con trỏ sau số vừa chèn (dùng setTimeout để đợi React update State)
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
      word_type: prev.word_type // Đảm bảo giữ lại word_type đang nhập
    }));
    
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
      // Chỉ lấy các ký tự là chữ Hán để vẽ (loại bỏ dấu cách, dấu câu...)
      const characters = detailedWord.word.match(/[\u4e00-\u9fa5]/g) || [];
      
      if (characters.length > 0) {
        const charToDraw = characters[currentCharIndex] || characters[0];
        const width = writerContainerRef.current.clientWidth;
        writerInstance.current = HanziWriter.create(writerContainerRef.current, charToDraw, {
          width: width,
          height: width,
          padding: 5,
          strokeColor: '#0ea5e9',
          outlineColor: '#eee',
          drawingColor: '#333',
          showOutline: true,
          delayBetweenLoops: 1000
        });
        
        // Tự động chuyển sang chữ tiếp theo sau khi vẽ xong
        writerInstance.current.animateCharacter({
          onComplete: () => {
            if (currentCharIndex < characters.length - 1) {
              setTimeout(() => setCurrentCharIndex(prev => prev + 1), 500); // Giảm xuống 500ms cho mượt
            }
          }
        });
      }

      if (currentCharIndex === 0) {
        setEditingExample({ 
          cn: detailedWord.example_cn || "", 
          py: detailedWord.example_py || "", 
          vi: detailedWord.example_vi || "" 
        });
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
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      // 1. Fetch Lessons
      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      
      // 2. Fetch Vocab
      const { data: dbVocab, error } = await supabase.from("vocab").select("*, lessons(name, id)");
      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");

      let finalLessons = [...(dbLessons || [])];
      let finalVocab: Word[] = [];

      if (!error && dbVocab) {
        finalVocab = dbVocab.map((item: any) => ({
          ...item,
          word_type: item.word_type || "", // Lấy đúng cột word_type từ DB
          lesson: item.lessons?.name || "Kho chung",
          lesson_id: item.lesson_id
        }));
      }

      // 3. MIGRATION LOGIC (Only if logged in)
      if (currentUser) {
        let migrationHappened = false;

        // Migrate Lessons
        for (const localL of localLessons) {
          if (!finalLessons.some(dbL => dbL.name === localL.name)) {
            const { data: newL } = await supabase.from("lessons").insert({ name: localL.name, user_id: currentUser.id }).select().single();
            if (newL) {
              finalLessons.push(newL);
              // Update vocab lesson_id for this migrated lesson
              localVocab.forEach((v: any) => { if (v.lesson_id === localL.id) v.lesson_id = newL.id; });
              migrationHappened = true;
            }
          }
        }

        // Migrate Vocab
        for (const localV of localVocab) {
          if (!finalVocab.some(dbV => dbV.word === localV.word)) {
            const { error: vErr } = await supabase.from("vocab").insert({
              word: localV.word,
              pinyin: localV.pinyin,
              meaning: localV.meaning,
              word_type: localV.word_type || "",
              lesson_id: localV.lesson_id,
              user_id: currentUser.id,
              example_cn: localV.example_cn,
              example_py: localV.example_py,
              example_vi: localV.example_vi
            });
            if (!vErr) migrationHappened = true;
          }
        }

        if (migrationHappened) {
          localStorage.removeItem("user_lessons");
          localStorage.removeItem("user_vocab");
          // Re-fetch to get clean IDs from DB
          const { data: refreshedVocab } = await supabase.from("vocab").select("*, lessons(name, id)");
          finalVocab = (refreshedVocab || []).map((item: any) => ({
            ...item,
            lesson: item.lessons?.name || "Kho chung",
            lesson_id: item.lesson_id
          }));
        }
      } else {
        // Not logged in: Show local + public
        finalLessons = [...finalLessons, ...localLessons];
        finalVocab = [...finalVocab, ...localVocab];
      }

      setLessons(finalLessons);
      setVocab(finalVocab);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedLessonId === "all") {
      alert("Vui lòng chọn một buổi học cụ thể trước khi nhập file!");
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

        const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
        let currentVocab = [...vocab, ...localVocab];
        let updatedLocal = [...localVocab];
        let addedCount = 0;

        // Logic thông minh: Chỉ bỏ qua hàng đầu nếu nó chứa chữ "Hán" hoặc "Từ" (tiêu đề)
        const firstCell = String(data[0]?.[0] || "").toLowerCase();
        const headerKeywords = ["hán", "từ", "word", "stt", "no."];
        const startIdx = headerKeywords.some(k => firstCell.includes(k)) ? 1 : 0;

        for (let i = startIdx; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          // Tự động tìm ô nào trong hàng có chứa chữ Hán (Smart Column Detection)
          const hanzi = row.find(val => {
            const str = String(val || "").trim();
            return /[\u4e00-\u9fa5]/.test(str);
          })?.toString().trim();

          if (!hanzi || hanzi === "undefined") continue;

          // Khử trùng: Nếu đã có Hán tự này rồi thì bỏ qua
          if (currentVocab.some(v => v.word === hanzi)) continue;

          let py = "";
          try {
            py = pinyin(hanzi, { toneType: 'symbol' }).replace(/\s+/g, '');
          } catch (e) {
            py = hanzi; // Fallback nếu lỗi pinyin
          }
          let meaning = "";
          try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(hanzi)}`);
            const transData = await res.json();
            meaning = transData?.[0]?.[0]?.[0] || "";
          } catch (err) {
            meaning = hanzi.split('').map((c: string) => HAN_VIET_DATA[c] || c).join(' ');
          }

          const newWord: Word = {
            id: `excel-${Date.now()}-${i}`,
            word: hanzi,
            pinyin: py,
            meaning: meaning,
            word_type: "", // Mặc định trống khi nhập Excel
            lesson_id: selectedLessonId
          };

          updatedLocal.push(newWord);
          currentVocab.push(newWord);
          addedCount++;
        }

        localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
        setVocab(currentVocab);
        setShowImportModal(false);
        alert(`Thành công! Đã thêm ${addedCount} từ mới (Đã tự động lọc bỏ các từ trùng lặp).`);
      } catch (err) {
        console.error("Lỗi nhập Excel:", err);
        alert("Có lỗi xảy ra khi xử lý file Excel! Vui lòng kiểm tra lại định dạng file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveNewWord = async () => {
    if (!newWord.word || !newWord.meaning || !newWord.lesson_id) {
      alert("Vui lòng nhập đầy đủ Hán tự, Nghĩa và chọn Buổi học!");
      return;
    }

    const isDuplicate = vocab.some(v => v.word === newWord.word);
    if (isDuplicate) {
      alert(`Từ "${newWord.word}" đã tồn tại trong danh sách! Vui lòng kiểm tra lại.`);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase.from("vocab").insert({
        word: newWord.word,
        pinyin: newWord.pinyin,
        meaning: newWord.meaning,
        word_type: newWord.word_type, // Đảm bảo lưu đúng word_type
        lesson_id: newWord.lesson_id,
        user_id: session.user.id,
        example_cn: newWord.example_cn,
        example_py: newWord.example_py,
        example_vi: newWord.example_vi
      }).select().single();

      if (!error && data) {
        setVocab(prev => [...prev, { ...data, lesson: lessons.find(l => l.id === data.lesson_id)?.name }]);
        setShowAddModal(false);
        setNewWord({ word: "", pinyin: "", meaning: "", word_type: "", lesson_id: "", example_cn: "", example_py: "", example_vi: "" });
        alert("Đã lưu lên Cloud thành công!");
      } else if (error) {
        alert("Lỗi khi lưu lên Cloud: " + error.message);
      }
    } else {
      const wordToAdd: Word = { ...newWord, id: `local-${Date.now()}` };
      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      localStorage.setItem("user_vocab", JSON.stringify([...localVocab, wordToAdd]));
      setVocab(prev => [...prev, wordToAdd]);
      setShowAddModal(false);
      setNewWord({ word: "", pinyin: "", meaning: "", word_type: "", lesson_id: "", example_cn: "", example_py: "", example_vi: "" });
      alert("Đã lưu tạm trên máy (Hãy đăng nhập để đồng bộ)!");
    }
  };

  const handleDeleteWord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa từ này không?")) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !id.startsWith("local-") && !id.startsWith("excel-")) {
      const { error } = await supabase.from("vocab").delete().eq("id", id);
      if (error) {
        alert("Lỗi khi xóa trên Cloud: " + error.message);
        return;
      }
    }

    const localData = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    localStorage.setItem("user_vocab", JSON.stringify(localData.filter((v: any) => v.id !== id)));
    setVocab(prev => prev.filter(v => v.id !== id));
    alert("Đã xóa từ vựng thành công!");
  };

  const handleUpdateWordInfo = async () => {
    if (!detailedWord) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !detailedWord.id.startsWith("local-") && !detailedWord.id.startsWith("excel-")) {
      const { error } = await supabase.from("vocab")
        .update({ 
          word: detailedWord.word, 
          pinyin: detailedWord.pinyin, 
          meaning: detailedWord.meaning,
          word_type: detailedWord.word_type,
          example_cn: editingExample.cn,
          example_py: editingExample.py,
          example_vi: editingExample.vi
        })
        .eq("id", detailedWord.id);

      if (error) {
        alert("Lỗi cập nhật Cloud: " + error.message);
        return;
      }
    } else {
      // Local/Excel update
      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      const updatedLocal = localVocab.map((v: any) => v.id === detailedWord.id ? {
        ...detailedWord,
        word_type: detailedWord.word_type, // Thêm dòng này để fix lỗi mất Loại từ
        example_cn: editingExample.cn,
        example_py: editingExample.py,
        example_vi: editingExample.vi
      } : v);
      localStorage.setItem("user_vocab", JSON.stringify(updatedLocal));
    }

    setVocab(prev => prev.map(v => v.id === detailedWord.id ? {
      ...detailedWord,
      example_cn: editingExample.cn,
      example_py: editingExample.py,
      example_vi: editingExample.vi
    } : v));
    alert("Đã cập nhật thông tin thành công!");
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
      "Loại từ": item.word_type || "",
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
                <th>Loại từ</th>
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
                  <td className={styles.typeCell}>{item.word_type}</td>
                  <td className={styles.meaningCell}>{item.meaning}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.iconGroup}>
                      <button className={styles.iconBtn} onClick={() => speak(item.word)} title="Phát âm"><Play size={16} /></button>
                      <button className={styles.iconBtn} onClick={() => handleOpenDetailed(item)} title="Chỉnh sửa"><Edit2 size={16} /></button>
                      <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={(e) => handleDeleteWord(item.id, e)} title="Xóa"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding: '1.5rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border)'}}>
            <button className={styles.addBtn} onClick={handleOpenAddModal}>
              <Plus size={20} /> Thêm từ mới ở đây
            </button>
          </div>
          {filteredVocab.length === 0 && <div className={styles.emptyState}>Bài học này hiện chưa có từ vựng nào.</div>}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.detailModal} style={{maxWidth:'500px', padding:'2rem'}} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom:'1rem'}}>Nhập thông minh từ Excel (.xlsx)</h2>
            <div style={{background:'rgba(14, 165, 233, 0.1)', padding:'1rem', borderRadius:'8px', marginBottom:'1.5rem', borderLeft:'4px solid var(--primary)'}}>
              <p style={{fontSize:'0.9rem', margin:0}}>
                <b>Bạn chỉ cần Excel 1 cột:</b> Điền <b>Hán tự</b> ở cột đầu tiên.<br/>
                <i>Hệ thống sẽ tự điền Pinyin và Nghĩa Việt!</i>
              </p>
            </div>
            {selectedLessonId === "all" ? (
              <p style={{color:'red', fontWeight:700}}>Vui lòng chọn bài học ở trang chính trước khi nhấn Nhập!</p>
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

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'1rem'}}>
              <div className={styles.formGroup}>
                <label>Loại từ</label>
                <input type="text" className={styles.formInput} placeholder="Danh từ, Động từ..." value={newWord.word_type} onChange={e => setNewWord({...newWord, word_type: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Nghĩa tiếng Việt *</label>
                <textarea 
                  className={styles.formInput} 
                  value={newWord.meaning} 
                  onChange={e => setNewWord({...newWord, meaning: e.target.value})} 
                  onKeyDown={e => handleKeyDown(e, (val) => setNewWord({...newWord, meaning: val}), newWord.meaning)}
                />
              </div>
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
              <textarea placeholder="Ví dụ Hán tự" className={`${styles.formInput} hanzi`} style={{marginBottom:'0.5rem'}} value={newWord.example_cn} onChange={e => setNewWord({...newWord, example_cn: e.target.value})} onKeyDown={e => handleKeyDown(e, (val) => setNewWord({...newWord, example_cn: val}), newWord.example_cn)} />
              <input type="text" placeholder="Ví dụ Pinyin" className={styles.formInput} style={{marginBottom:'0.5rem'}} value={newWord.example_py} onChange={e => setNewWord({...newWord, example_py: e.target.value})} />
              <textarea placeholder="Ví dụ Nghĩa Việt" className={styles.formInput} value={newWord.example_vi} onChange={e => setNewWord({...newWord, example_vi: e.target.value})} onKeyDown={e => handleKeyDown(e, (val) => setNewWord({...newWord, example_vi: val}), newWord.example_vi)} />
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
                  {(detailedWord.word.match(/[\u4e00-\u9fa5]/g) || []).map((char, index) => (
                    <button key={index} className={`${styles.charTab} ${currentCharIndex === index ? styles.activeCharTab : ''} hanzi`} onClick={(e) => { e.stopPropagation(); setCurrentCharIndex(index); }} title={`Xem chữ ${char}`}>{char}</button>
                  ))}
                </div>
                <div className={styles.modalControls}>
                  <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setCurrentCharIndex(0); writerInstance.current?.animateCharacter(); }}><Play size={14} style={{marginRight: '5px'}} /> Vẽ lại</button>
                </div>
              </div>
              <div className={styles.infoSection}>
                <div className={styles.mainInfo}>
                  <div className={styles.formGroup}>
                    <label>Hán tự</label>
                    <textarea 
                      className={`${styles.formInput} hanzi`} 
                      style={{fontSize:'1.8rem', fontWeight:700}} 
                      value={detailedWord.word} 
                      onChange={e => setDetailedWord({...detailedWord, word: e.target.value})} 
                      onKeyDown={e => handleKeyDown(e, (val) => setDetailedWord({...detailedWord, word: val}), detailedWord.word)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Pinyin</label>
                    <input type="text" className={styles.formInput} value={detailedWord.pinyin} onChange={e => setDetailedWord({...detailedWord, pinyin: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nghĩa Việt</label>
                    <textarea 
                      className={styles.formInput} 
                      value={detailedWord.meaning} 
                      onChange={e => setDetailedWord({...detailedWord, meaning: e.target.value})} 
                      onKeyDown={e => handleKeyDown(e, (val) => setDetailedWord({...detailedWord, meaning: val}), detailedWord.meaning)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Loại từ</label>
                    <input type="text" className={styles.formInput} value={detailedWord.word_type} onChange={e => setDetailedWord({...detailedWord, word_type: e.target.value})} />
                  </div>
                </div>
                <div className={styles.exampleForm}>
                  <p style={{fontWeight:700, margin:0}}>Ví dụ học tập:</p>
                  <div className={styles.formGroup}>
                    <label>Ví dụ (Hán tự)</label>
                    <textarea className={`${styles.formInput} hanzi`} value={editingExample.cn} onChange={e => setEditingExample({...editingExample, cn: e.target.value})} onKeyDown={e => handleKeyDown(e, (val) => setEditingExample({...editingExample, cn: val}), editingExample.cn)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Pinyin</label>
                    <input type="text" className={styles.formInput} value={editingExample.py} onChange={e => setEditingExample({...editingExample, py: e.target.value})} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Nghĩa Việt</label>
                    <textarea className={styles.formInput} value={editingExample.vi} onChange={e => setEditingExample({...editingExample, vi: e.target.value})} onKeyDown={e => handleKeyDown(e, (val) => setEditingExample({...editingExample, vi: val}), editingExample.vi)} />
                  </div>
                  <button className={styles.saveBtn} style={{width:'100%', marginTop:'1rem'}} onClick={handleUpdateWordInfo}><Save size={18} style={{marginRight:'0.5rem'}} /> Lưu tất cả thay đổi</button>
                  <button 
                    className={styles.iconBtn} 
                    style={{background:'#ef4444', color:'white', width:'100%', marginTop:'0.5rem', justifyContent:'center'}} 
                    onClick={() => {
                      if(confirm("Xóa từ này?")) {
                        const localData = JSON.parse(localStorage.getItem("user_vocab") || "[]");
                        localStorage.setItem("user_vocab", JSON.stringify(localData.filter((v:any)=>v.id !== detailedWord.id)));
                        setVocab(prev => prev.filter(v => v.id !== detailedWord.id));
                        setDetailedWord(null);
                        alert("Đã xóa!");
                      }
                    }}
                  >
                    <Trash2 size={16} /> Xóa từ này
                  </button>
                </div>
              </div>
            </div>
            <button style={{padding:'1rem', background:'rgba(0,0,0,0.05)', fontWeight:700}} onClick={() => setDetailedWord(null)}>Đóng</button>
          </div>
        </div>
      )}

      {/* Nút Thêm Nhanh (Góc phải dưới) */}
      <button className={styles.floatingAddBtn} onClick={handleOpenAddModal} title="Thêm từ mới nhanh">
        <Plus size={28} />
      </button>
    </div>
  );
}

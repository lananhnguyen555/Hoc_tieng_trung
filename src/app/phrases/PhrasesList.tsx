"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Play, Plus, X, Edit2, Trash2, BookOpen, MessageCircle, Save } from "lucide-react";
import styles from "../vocab/vocab.module.css";
import HanziWriter from "hanzi-writer";
import { supabase } from "@/lib/supabase";
import HanziSuggester from "@/components/HanziSuggester";
import { HAN_VIET_DATA } from "@/lib/han-viet";
import * as XLSX from "xlsx";
import { FileUp, LogIn, GripVertical } from "lucide-react";
import { pinyin } from "pinyin-pro";
import { isAdmin } from "@/lib/auth-utils";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface Phrase {
  id: string;
  word: string; // Nội dung
  meaning: string; // Ghi chú
  lesson_id: string;
  sort_order: number;
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
    word: "", meaning: "", lesson_id: ""
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setNewPhrase({ 
      word: "", 
      meaning: "", 
      lesson_id: selectedLessonId === "all" ? "" : selectedLessonId
    });
    setShowAddModal(true);
  };

  const sortLessons = (lessonList: any[]) => {
    return [...lessonList].sort((a, b) => {
      const numA = a.name.match(/\d+/);
      const numB = b.name.match(/\d+/);

      if (numA && numB) {
        return parseInt(numA[0]) - parseInt(numB[0]);
      }
      if (numA) return -1;
      if (numB) return 1;

      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateA - dateB;
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");

      const { data: dbPhrases, error } = await supabase.from("phrases").select("*").order("sort_order", { ascending: true });
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

      setLessons(sortLessons(finalLessons));
      setPhrases(finalPhrases.sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)));
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setUserEmail(currentSession?.user?.email || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSaveNewPhrase = async () => {
    if (!newPhrase.word || !newPhrase.lesson_id) {
      alert("Vui lòng nhập Nội dung và chọn Buổi học!");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase.from("phrases").insert({
        word: newPhrase.word,
        meaning: newPhrase.meaning,
        lesson_id: newPhrase.lesson_id,
        user_id: session.user.id
      }).select().single();

      if (!error && data) {
        setPhrases(prev => [...prev, data]);
        setShowAddModal(false);
        setNewPhrase({ word: "", meaning: "", lesson_id: "" });
        alert("Đã lưu Cloud!");
      }
    } else {
      const phraseToAdd: Phrase = { 
        ...newPhrase, 
        id: `phrase-${Date.now()}`,
        sort_order: phrases.length
      };
      const localPhrases = JSON.parse(localStorage.getItem("user_phrases") || "[]");
      localStorage.setItem("user_phrases", JSON.stringify([...localPhrases, phraseToAdd]));
      setPhrases(prev => [...prev, phraseToAdd]);
      setShowAddModal(false);
      alert("Đã lưu tạm trên máy!");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !isAdmin(userEmail)) return;

    const oldIndex = phrases.findIndex((item) => item.id === active.id);
    const newIndex = phrases.findIndex((item) => item.id === over.id);

    const newList = arrayMove(phrases, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sort_order: index
    }));

    setPhrases(newList);

    const updates = newList.filter(item => !item.id.startsWith('phrase-')).map(item => ({
      id: item.id,
      sort_order: item.sort_order,
      word: item.word,
      meaning: item.meaning,
      lesson_id: item.lesson_id
    }));

    if (updates.length > 0) {
      await supabase.from("phrases").upsert(updates);
    }

    const locals = newList.filter(item => item.id.startsWith('phrase-'));
    localStorage.setItem("user_phrases", JSON.stringify(locals));
  };

  const handleUpdatePhraseInfo = async () => {
    if (!detailedPhrase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && !detailedPhrase.id.startsWith("phrase-")) {
      const { error } = await supabase.from("phrases").update({
        word: detailedPhrase.word,
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
      "STT": index + 1, "Nội dung": item.word, "Ghi chú": item.meaning
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GiaoTiep");
    XLSX.writeFile(workbook, `GiaoTiep_${new Date().toLocaleDateString()}.xlsx`);
  };

  const filteredPhrases = phrases.filter(item => {
    const matchesSearch = item.word.includes(search) || item.meaning.toLowerCase().includes(search.toLowerCase());
    
    if (search.trim() !== "") {
      return matchesSearch;
    } else {
      if (selectedLessonId === "all") return false;
      return matchesSearch && item.lesson_id === selectedLessonId;
    }
  });

  const getLessonName = (id: string) => {
    return lessons.find(l => l.id === id)?.name || "Kho chung";
  };

  const handleOpenDetailed = (p: Phrase) => {
    setDetailedPhrase(p);
  };



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
            <button className={styles.iconBtn} onClick={handleAddLesson} title="Thêm buổi học mới" style={{padding:'5px', background:'var(--primary)', color:'white', borderRadius:'4px', display:'flex'}}>
              <Plus size={20} />
            </button>
            {selectedLessonId !== "all" && isAdmin(userEmail) && (
              <button className={styles.iconBtn} onClick={handleDeleteLesson} title="Xóa buổi này" style={{padding:'5px', background:'#ef4444', color:'white', borderRadius:'4px', display:'flex'}}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <input type="text" placeholder="Tìm kiếm câu giao tiếp..." className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className={styles.actionBtns}>
          <button className={styles.addBtn} style={{background:'#1ea362', color:'white'}} onClick={handleExportExcel}>
            <FileUp size={20} /> Xuất Excel
          </button>
          <button className={styles.addBtn} style={{background:'var(--foreground)', color:'white'}} onClick={() => setShowImportModal(true)}>
            <LogIn size={20} /> Nhập Excel
          </button>
          {isAdmin(userEmail) && (
            <button className={styles.addBtn} onClick={handleOpenAddModal}>
              <Plus size={20} /> Thêm câu mới
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Đang tải...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <table className={styles.vocabTable}>
              <thead>
                <tr>
                  <th className={styles.sttCell}>STT</th>
                  <th>Nội dung (Hán tự + Pinyin)</th>
                  <th>Nghĩa tiếng Việt</th>
                  {search.trim() !== "" && <th>Buổi học</th>}
                  {isAdmin(userEmail) && <th className={styles.actionCell}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                <SortableContext 
                  items={filteredPhrases.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredPhrases.map((item, index) => (
                    <SortableRow 
                      key={item.id} 
                      item={item} 
                      index={index} 
                      isAdmin={isAdmin(userEmail)}
                      onEdit={() => handleOpenDetailed(item)}
                      onDelete={() => handleDeletePhrase(item.id)}
                      onSpeak={() => speak(item.word)}
                      showLesson={search.trim() !== ""}
                      lessonName={getLessonName(item.lesson_id)}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      )}



      {isAdmin(userEmail) && (
        <button className={styles.floatingAddBtn} onClick={handleOpenAddModal} title="Thêm mẫu câu mới nhanh">
          <Plus size={28} />
        </button>
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
              <label>Hán tự *</label>
              <textarea 
                className={styles.formInput} 
                rows={3} 
                placeholder="Nhập chữ Hán..." 
                value={newPhrase.word} 
                onChange={e => setNewPhrase({...newPhrase, word: e.target.value})} 
                onKeyDown={e => handleKeyDown(e, (val) => setNewPhrase({...newPhrase, word: val}), newPhrase.word)}
              />
            </div>

            <div className={styles.formGroup} style={{marginBottom:'2rem'}}>
              <label>Nghĩa tiếng Việt *</label>
              <textarea 
                className={styles.formInput} 
                rows={2} 
                placeholder="Nghĩa của câu..." 
                value={newPhrase.meaning} 
                onChange={e => setNewPhrase({...newPhrase, meaning: e.target.value})} 
                onKeyDown={e => handleKeyDown(e, (val) => setNewPhrase({...newPhrase, meaning: val}), newPhrase.meaning)}
              />
            </div>
            <div className={styles.formGroup} style={{marginBottom:'1.5rem'}}>
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
          <div className={styles.detailModal} style={{maxWidth:'600px'}} onClick={e => e.stopPropagation()}>
            <div style={{padding:'2rem'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
                <h2 style={{margin:0}}>Chỉnh sửa thông tin</h2>
                <X style={{cursor:'pointer'}} onClick={() => setDetailedPhrase(null)} />
              </div>
              
              <div className={styles.infoSection} style={{padding:0}}>
                <div className={styles.formGroup} style={{marginBottom:'1rem'}}>
                  <label>Hán tự</label>
                  <textarea 
                    className={`${styles.formInput} hanzi`} 
                    style={{fontSize:'1.8rem', minHeight:'100px'}} 
                    value={detailedPhrase.word} 
                    onChange={e => setDetailedPhrase({...detailedPhrase, word: e.target.value})} 
                    onKeyDown={e => handleKeyDown(e, (val) => setDetailedPhrase({...detailedPhrase, word: val}), detailedPhrase.word)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Nghĩa tiếng Việt</label>
                  <textarea 
                    className={styles.formInput} 
                    style={{minHeight:'60px'}} 
                    value={detailedPhrase.meaning} 
                    onChange={e => setDetailedPhrase({...detailedPhrase, meaning: e.target.value})} 
                    onKeyDown={e => handleKeyDown(e, (val) => setDetailedPhrase({...detailedPhrase, meaning: val}), detailedPhrase.meaning)}
                  />
                </div>
                {isAdmin(userEmail) && (
                  <button className={styles.saveBtn} style={{width:'100%', marginTop:'2rem'}} onClick={handleUpdatePhraseInfo}>
                    <Save size={18} style={{marginRight:'0.5rem'}} /> Lưu thay đổi
                  </button>
                )}
              </div>
            </div>
            <button style={{padding:'1rem', width:'100%', borderTop:'1px solid var(--border)', fontWeight:700}} onClick={() => setDetailedPhrase(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableRow({ item, index, isAdmin, onEdit, onDelete, onSpeak, showLesson, lessonName }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 200 : 0,
    position: 'relative' as any,
    background: isDragging ? '#f1f5f9' : undefined,
    opacity: isDragging ? 0.8 : 1
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td className={styles.sttCell} {...(isAdmin ? attributes : {})} {...(isAdmin ? listeners : {})} style={{cursor: isAdmin ? 'grab' : 'default'}}>
        {isAdmin && <GripVertical size={14} style={{marginRight: 4, opacity: 0.5}} />}
        {index + 1}
      </td>
      <td className={styles.wordCell} style={{minWidth: '250px'}} onClick={onEdit}>
        <div className="hanzi" style={{lineHeight: 1.1, fontSize: '2.5rem'}}>{item.word}</div>
        <div className={styles.pinyinSub} style={{fontWeight: 800, color: '#0f172a', fontSize: '0.95rem'}}>
          ({pinyin(item.word, { toneType: 'symbol' })})
        </div>
      </td>
      <td className={styles.meaningCell} style={{fontSize: '1rem', fontWeight: 600}}>
        {item.meaning}
      </td>
      {showLesson && <td style={{fontSize:'0.8rem', color:'var(--primary)', fontWeight:600}}>{lessonName}</td>}
      <td className={styles.actionCell}>
        <div className={styles.iconGroup}>
          <button className={styles.iconBtn} onClick={onSpeak} title="Phát âm"><Play size={16} /></button>
          {isAdmin && (
            <>
              <button className={styles.iconBtn} onClick={onEdit} title="Chỉnh sửa"><Edit2 size={16} /></button>
              <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={onDelete} title="Xóa"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

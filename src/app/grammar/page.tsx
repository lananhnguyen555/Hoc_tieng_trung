"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X, Edit2, Trash2, Filter, ChevronDown, Maximize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./grammar.module.css";
import { pinyin } from "pinyin-pro";

interface GrammarItem {
  id: string;
  title: string; // Nội dung
  content: string; // Ghi chú
  lesson: string;
}

export default function GrammarPage() {
  const [grammarList, setGrammarList] = useState<GrammarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GrammarItem | null>(null);
  const [newItem, setNewItem] = useState({ title: "", content: "", lesson: "" });
  const [selectedLesson, setSelectedLesson] = useState<string>("all");
  
  // State for Fullscreen Hanzi Display
  const [fullScreenItem, setFullScreenItem] = useState<GrammarItem | null>(null);

  useEffect(() => {
    fetchGrammar();
  }, []);

  const fetchGrammar = async () => {
    try {
      const { data, error } = await supabase
        .from("grammar")
        .select("*")
        .order("lesson", { ascending: true });

      if (error) throw error;
      
      const localData = JSON.parse(localStorage.getItem("user_grammar") || "[]");
      const formattedLocal = localData.map((item: any) => ({
        ...item,
        lesson: item.lesson || "Chưa phân loại"
      }));
      
      setGrammarList([...(data || []), ...formattedLocal]);
    } catch (err) {
      console.error("Error fetching grammar:", err);
      const localData = JSON.parse(localStorage.getItem("user_grammar") || "[]");
      setGrammarList(localData.map((i: any) => ({ ...i, lesson: i.lesson || "Chưa phân loại" })));
    } finally {
      setLoading(false);
    }
  };

  const uniqueLessons = useMemo(() => {
    const lessons = Array.from(new Set(grammarList.map(item => item.lesson)));
    return lessons.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [grammarList]);

  const filteredGrammar = useMemo(() => {
    if (selectedLesson === "all") return grammarList;
    return grammarList.filter(item => item.lesson === selectedLesson);
  }, [grammarList, selectedLesson]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = { 
      ...newItem, 
      lesson: newItem.lesson || "Chưa phân loại",
      id: `local-g-${Date.now()}` 
    };
    const localData = JSON.parse(localStorage.getItem("user_grammar") || "[]");
    localStorage.setItem("user_grammar", JSON.stringify([...localData, entry]));
    
    setGrammarList(prev => [entry, ...prev]);
    setShowAddModal(false);
    setNewItem({ title: "", content: "", lesson: "" });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa cấu trúc ngữ pháp này?")) return;
    const localData = JSON.parse(localStorage.getItem("user_grammar") || "[]");
    const updatedLocal = localData.filter((i: any) => i.id !== id);
    localStorage.setItem("user_grammar", JSON.stringify(updatedLocal));
    setGrammarList(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const localData = JSON.parse(localStorage.getItem("user_grammar") || "[]");
    const updatedLocal = localData.map((i: any) => i.id === editingItem.id ? editingItem : i);
    localStorage.setItem("user_grammar", JSON.stringify(updatedLocal));
    setGrammarList(prev => prev.map(i => i.id === editingItem.id ? editingItem : i));
    setShowEditModal(false);
  };



  const renderTextWithPinyin = (text: string) => {
    // Tự động tìm các đoạn chữ Hán và thêm Pinyin bên cạnh
    return text.split(/([\u4e00-\u9fa5]+)/g).map((part, i) => {
      if (/[\u4e00-\u9fa5]/.test(part)) {
        const py = pinyin(part, { toneType: 'symbol' });
        return (
          <span key={i}>
            {part}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 500 }}>
              ({py})
            </span>
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ngữ pháp tiếng Trung</h1>
        <p className={styles.subtitle}>Danh sách cấu trúc ngữ pháp được đánh số và trình bày khoa học.</p>
        
        <div className={styles.toolbar} style={{justifyContent: 'flex-end'}}>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> Thêm bài mới
          </button>
        </div>
      </header>

      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.grammarTable}>
            <thead>
              <tr>
                <th className={styles.sttCell}>STT</th>
                <th>Nội dung (Bao gồm Hán tự)</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrammar.map((item, index) => (
                <tr key={item.id} onClick={() => { setEditingItem(item); setShowEditModal(true); }} style={{cursor:'pointer'}}>
                  <td className={styles.sttCell}>{index + 1}</td>
                  <td 
                    className={`${styles.titleCell} hanzi`}
                    onClick={(e) => { e.stopPropagation(); setFullScreenItem(item); }}
                  >
                    {renderTextWithPinyin(item.title)}
                  </td>
                  <td className={styles.contentCell}>{item.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredGrammar.length === 0 && (
            <div className={styles.empty}>
              Chưa có dữ liệu cho mục này.
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Hanzi Display Overlay */}
      {fullScreenItem && (
        <div className={styles.fullscreenOverlay} onClick={() => setFullScreenItem(null)}>
          <div className={styles.closeFullscreen}><X size={40} /></div>
          <div className={`${styles.fullscreenHanzi} hanzi`}>
            {fullScreenItem.title.match(/[\u4e00-\u9fa5]+/g)?.[0] || fullScreenItem.title}
          </div>
          <div className={styles.fullscreenInfo}>
            <p className={styles.fullscreenTitle}>{fullScreenItem.title}</p>
            <p>Nhấp vào bất kỳ đâu để đóng</p>
          </div>
        </div>
      )}

      {/* Modals for Add/Edit remain similar structure but integrated into UI */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{margin:0}}>Thêm ngữ pháp mới</h2>
              <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddItem} className={styles.form} style={{marginTop: '1.5rem', display:'flex', flexDirection:'column', gap:'1.2rem'}}>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Nội dung (Chữ Hán, cấu trúc...)</label>
                <textarea 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="Nhập bất kỳ nội dung gì bạn muốn..."
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', minHeight:'100px'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Ghi chú</label>
                <textarea 
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                  placeholder="Giải thích, ví dụ..."
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', minHeight:'80px'}}
                />
              </div>
              <button type="submit" className="btn-primary" style={{marginTop:'1rem'}}>Lưu bài học</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{margin:0}}>Sửa bài học</h2>
              <button onClick={() => setShowEditModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdate} className={styles.form} style={{marginTop: '1.5rem', display:'flex', flexDirection:'column', gap:'1.2rem'}}>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Nội dung</label>
                <textarea 
                  value={editingItem.title}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', minHeight:'100px'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Ghi chú</label>
                <textarea 
                  value={editingItem.content}
                  onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', minHeight:'80px'}}
                />
              </div>
              <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
                <button type="submit" className="btn-primary" style={{flex:1}}>Cập nhật bài học</button>
                <button 
                  type="button" 
                  className={styles.iconBtn} 
                  style={{background:'#ef4444', color:'white', width:'auto', padding:'0 1rem'}} 
                  onClick={(e) => { handleDelete(editingItem.id, e); setShowEditModal(false); }}
                >
                  <Trash2 size={20} /> Xóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

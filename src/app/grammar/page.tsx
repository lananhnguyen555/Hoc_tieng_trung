"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X, Edit2, Trash2, Filter, ChevronDown, Maximize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./grammar.module.css";

interface GrammarItem {
  id: string;
  title: string;
  content: string;
  example: string;
  lesson: string;
}

export default function GrammarPage() {
  const [grammarList, setGrammarList] = useState<GrammarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GrammarItem | null>(null);
  const [newItem, setNewItem] = useState({ title: "", content: "", example: "", lesson: "" });
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
    setNewItem({ title: "", content: "", example: "", lesson: "" });
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ngữ pháp tiếng Trung</h1>
        <p className={styles.subtitle}>Danh sách cấu trúc ngữ pháp được đánh số và trình bày khoa học.</p>
        
        <div className={styles.toolbar}>
          <div className={styles.filterSection}>
            <label htmlFor="lesson-filter"><Filter size={18} /> Buổi học:</label>
            <div className={styles.selectWrapper}>
              <select 
                id="lesson-filter"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className={styles.lessonSelect}
              >
                <option value="all">Tất cả bài học</option>
                {uniqueLessons.map(lesson => (
                  <option key={lesson} value={lesson}>{lesson}</option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} size={16} />
            </div>
          </div>
          
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
                <th>STT</th>
                <th>Buổi</th>
                <th>Cấu trúc (Hán tự)</th>
                <th>Giải thích chi tiết</th>
                <th>Ví dụ minh họa</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrammar.map((item, index) => (
                <tr key={item.id}>
                  <td className={styles.sttCell}>{index + 1}</td>
                  <td><span className={styles.lessonBadge}>{item.lesson}</span></td>
                  <td 
                    className={`${styles.titleCell} hanzi`}
                    onClick={() => setFullScreenItem(item)}
                    title="Nhấn để phóng to chữ Hán"
                  >
                    {item.title}
                  </td>
                  <td className={styles.contentCell}>{item.content}</td>
                  <td className={styles.exampleCell}>
                    {item.example && (
                      <div className={styles.exampleBox}>
                        <div 
                          className={`${styles.exampleHanzi} hanzi`}
                          onClick={() => setFullScreenItem({ ...item, title: item.example.split(' ')[0] })}
                        >
                          {item.example}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className={styles.actionCell}>
                    <div className={styles.actionGroup}>
                      <button className={styles.iconBtn} onClick={() => { setEditingItem(item); setShowEditModal(true); }}>
                        <Edit2 size={16} />
                      </button>
                      <button className={styles.iconBtn} onClick={(e) => handleDelete(item.id, e)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
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
                <label style={{fontWeight:700}}>Buổi học</label>
                <input 
                  type="text" 
                  value={newItem.lesson}
                  onChange={e => setNewItem({...newItem, lesson: e.target.value})}
                  placeholder="Ví dụ: Buổi 1"
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Cấu trúc (Hán tự)</label>
                <input 
                  type="text" 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="Ví dụ: 正在"
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Giải thích</label>
                <textarea 
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                  placeholder="Cách sử dụng..."
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', minHeight:'100px'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Ví dụ</label>
                <input 
                  type="text" 
                  value={newItem.example}
                  onChange={e => setNewItem({...newItem, example: e.target.value})}
                  placeholder="Hán tự (Pinyin) - Nghĩa"
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
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
                <label style={{fontWeight:700}}>Buổi học</label>
                <input 
                  type="text" 
                  value={editingItem.lesson}
                  onChange={e => setEditingItem({...editingItem, lesson: e.target.value})}
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Cấu trúc (Hán tự)</label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Giải thích</label>
                <textarea 
                  value={editingItem.content}
                  onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', minHeight:'100px'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Ví dụ</label>
                <input 
                  type="text" 
                  value={editingItem.example}
                  onChange={e => setEditingItem({...editingItem, example: e.target.value})}
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)'}}
                />
              </div>
              <button type="submit" className="btn-primary" style={{marginTop:'1rem'}}>Cập nhật bài học</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

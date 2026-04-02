"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X, Edit2, Trash2, BookOpen, Filter, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./grammar.module.css";

interface GrammarItem {
  id: string;
  title: string;
  content: string;
  example: string;
  lesson: string; // Thêm trường buổi học
}

export default function GrammarPage() {
  const [grammarList, setGrammarList] = useState<GrammarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GrammarItem | null>(null);
  const [newItem, setNewItem] = useState({ title: "", content: "", example: "", lesson: "" });
  const [selectedLesson, setSelectedLesson] = useState<string>("all");

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
      // Đảm bảo dữ liệu cũ vẫn hoạt động
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

  // Lấy danh sách các buổi học duy nhất
  const uniqueLessons = useMemo(() => {
    const lessons = Array.from(new Set(grammarList.map(item => item.lesson)));
    return lessons.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [grammarList]);

  // Lọc danh sách theo buổi học được chọn
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

  const handleDelete = (id: string) => {
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
        <p className={styles.subtitle}>Tổng hợp các cấu trúc quan trọng được phân loại theo từng buổi học.</p>
        
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
            <Plus size={20} /> Thêm ngữ pháp
          </button>
        </div>
      </header>

      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.grid}>
          {filteredGrammar.map((item) => (
            <div key={item.id} className={`card ${styles.grammarCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.lessonBadge}>{item.lesson}</span>
                <div className={styles.cardActions}>
                  <button onClick={() => { setEditingItem(item); setShowEditModal(true); }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h2 className="hanzi">{item.title}</h2>
              <p className={styles.content}>{item.content}</p>
              {item.example && (
                <div className={styles.exampleBox}>
                  <strong>Ví dụ:</strong>
                  <p className="hanzi">{item.example}</p>
                </div>
              )}
            </div>
          ))}
          {filteredGrammar.length === 0 && (
            <div className={styles.empty}>
              {selectedLesson === "all" ? "Chưa có dữ liệu ngữ pháp." : `Không có bài học nào trong ${selectedLesson}.`}
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Thêm cấu trúc mới</h2>
              <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddItem} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Buổi học (Lesson)</label>
                <input 
                  type="text" 
                  value={newItem.lesson}
                  onChange={e => setNewItem({...newItem, lesson: e.target.value})}
                  placeholder="Ví dụ: Buổi 1, Lesson 2..."
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tên cấu trúc</label>
                <input 
                  type="text" 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="Ví dụ: Cấu trúc 正在 (Đang)"
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Giải giải thích</label>
                <textarea 
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                  placeholder="Dùng để diễn tả hành động đang diễn ra..."
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ví dụ</label>
                <input 
                  type="text" 
                  value={newItem.example}
                  onChange={e => setNewItem({...newItem, example: e.target.value})}
                  placeholder="Hán tự (Pinyin) - Nghĩa"
                />
              </div>
              <button type="submit" className="btn-primary">Lưu lại</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Sửa cấu trúc</h2>
              <button onClick={() => setShowEditModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdate} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Buổi học (Lesson)</label>
                <input 
                  type="text" 
                  value={editingItem.lesson}
                  onChange={e => setEditingItem({...editingItem, lesson: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tên cấu trúc</label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Giải thích</label>
                <textarea 
                  value={editingItem.content}
                  onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ví dụ</label>
                <input 
                  type="text" 
                  value={editingItem.example}
                  onChange={e => setEditingItem({...editingItem, example: e.target.value})}
                />
              </div>
              <button type="submit" className="btn-primary">Cập nhật</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

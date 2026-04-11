"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, X, Edit2, Trash2, Filter, ChevronDown, Maximize2, FileUp, GripVertical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./grammar.module.css";
import { pinyin } from "pinyin-pro";
import * as XLSX from "xlsx";
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

interface GrammarItem {
  id: string;
  title: string;
  content: string;
  lesson: string;
  sort_order: number;
}

export default function GrammarPage() {
  const [grammarList, setGrammarList] = useState<GrammarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GrammarItem | null>(null);
  const [newItem, setNewItem] = useState({ title: "", content: "", lesson: "" });
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Để tránh việc click nhầm là drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchGrammar();
  }, []);

  const fetchGrammar = async () => {
    try {
      const { data, error } = await supabase
        .from("grammar")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      
      const localData = JSON.parse(localStorage.getItem("user_grammar") || "[]");
      const formattedLocal = localData.map((item: any) => ({
        ...item,
        lesson: item.lesson || "Chưa phân loại"
      }));
      
      setGrammarList([...(data || []), ...formattedLocal].sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)));
      
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email || null);
    } catch (err) {
      console.error("Error fetching grammar:", err);
      const localData = JSON.parse(localStorage.getItem("user_grammar") || "[]");
      setGrammarList(localData.map((i: any) => ({ ...i, lesson: i.lesson || "Chưa phân loại" })).sort((a:any, b:any) => (a.sort_order || 0) - (b.sort_order || 0)));
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

  const uniqueLessons = useMemo(() => {
    const lessons = Array.from(new Set(grammarList.map(item => item.lesson)));
    return lessons.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [grammarList]);

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

  const filteredGrammar = useMemo(() => {
    return grammarList; // Trang ngữ pháp dùng chung hoặc lọc theo logic khác nếu cần
  }, [grammarList]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !isAdmin(userEmail)) return;

    const oldIndex = grammarList.findIndex((item) => item.id === active.id);
    const newIndex = grammarList.findIndex((item) => item.id === over.id);

    const newList = arrayMove(grammarList, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sort_order: index
    }));

    setGrammarList(newList);

    // Cập nhật Cloud if admin
    const updates = newList.filter(item => !item.id.startsWith('local-')).map(item => ({
      id: item.id,
      sort_order: item.sort_order,
      title: item.title,
      content: item.content,
      lesson: item.lesson
    }));

    if (updates.length > 0) {
      await supabase.from("grammar").upsert(updates);
    }

    // Cập nhật Local
    const locals = newList.filter(item => item.id.startsWith('local-'));
    localStorage.setItem("user_grammar", JSON.stringify(locals));
  };

  const handleExportExcel = () => {
    const data = grammarList.map((item, index) => ({
      "STT": index + 1,
      "Nội dung": item.title,
      "Ghi chú": item.content,
      "Phân loại": item.lesson
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NguPhap");
    XLSX.writeFile(wb, `NguPhap_${new Date().toLocaleDateString()}.xlsx`);
  };

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
    // Tự động tìm các đoạn chữ Hán và thêm Pinyin bên dưới
    return text.split(/([\u4e00-\u9fa5]+)/g).map((part, i) => {
      if (/[\u4e00-\u9fa5]/.test(part)) {
        const py = pinyin(part, { toneType: 'symbol' });
        return (
          <span key={i} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'middle', margin: '0 4px' }}>
            <span className="hanzi" style={{ lineHeight: 1 }}>{part}</span>
            <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>
              ({py})
            </span>
          </span>
        );
      }
      return <span key={i} style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{part}</span>;
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ngữ pháp tiếng Trung</h1>
        <p className={styles.subtitle}>Danh sách cấu trúc ngữ pháp được trình bày khoa học (Nhấn giữ STT để đổi thứ tự).</p>
        <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
          <button className={styles.addBtn} style={{background:'#16a34a'}} onClick={handleExportExcel}><FileUp size={20} /> Xuất Excel</button>
          {isAdmin(userEmail) && <button className={styles.addBtn} onClick={() => setShowAddModal(true)}><Plus size={20} /> Thêm ngữ pháp</button>}
        </div>
      </header>

      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <table className={styles.grammarTable}>
              <thead>
                <tr>
                  <th className={styles.sttCell}>STT</th>
                  <th>Nội dung (Bao gồm Hán tự)</th>
                  <th>Ghi chú</th>
                  {isAdmin(userEmail) && <th className={styles.actionCell}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                <SortableContext 
                  items={filteredGrammar.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredGrammar.map((item, index) => (
                    <SortableRow 
                      key={item.id} 
                      item={item} 
                      index={index} 
                      isAdmin={isAdmin(userEmail)}
                      onEdit={() => { setEditingItem(item); setShowEditModal(true); }}
                      onDelete={(e) => handleDelete(item.id, e)}
                      renderTextWithPinyin={renderTextWithPinyin}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
          {filteredGrammar.length === 0 && (
            <div className={styles.empty}>
              Chưa có dữ liệu cho mục này.
            </div>
          )}
        </div>
      )}

      {/* FAB Thêm nhanh */}
      {isAdmin(userEmail) && (
        <button className={styles.floatingAddBtn} onClick={() => setShowAddModal(true)} title="Thêm mới nhanh">
          <Plus size={28} />
        </button>
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
                  onKeyDown={e => handleKeyDown(e, (val) => setNewItem({...newItem, title: val}), newItem.title)}
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
                  onKeyDown={e => handleKeyDown(e, (val) => setNewItem({...newItem, content: val}), newItem.content)}
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
                  onKeyDown={e => handleKeyDown(e, (val) => setEditingItem({...editingItem, title: val}), editingItem.title)}
                  required 
                  style={{padding:'0.8rem', borderRadius:'8px', border:'1px solid var(--border)', minHeight:'100px'}}
                />
              </div>
              <div className="form-group" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Ghi chú</label>
                <textarea 
                  value={editingItem.content}
                  onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                  onKeyDown={e => handleKeyDown(e, (val) => setEditingItem({...editingItem, content: val}), editingItem.content)}
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

function SortableRow({ item, index, isAdmin, onEdit, onDelete, renderTextWithPinyin }: any) {
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
      <td className={styles.titleCell}>
        {renderTextWithPinyin(item.title)}
      </td>
      <td className={styles.contentCell}>{renderTextWithPinyin(item.content)}</td>
      {isAdmin && (
        <td className={styles.actionCell}>
          <div className={styles.actionGroup}>
            <button className={styles.iconBtn} onClick={onEdit} title="Sửa"><Edit2 size={18} /></button>
            <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={onDelete} title="Xóa"><Trash2 size={18} /></button>
          </div>
        </td>
      )}
    </tr>
  );
}

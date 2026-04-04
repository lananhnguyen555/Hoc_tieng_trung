"use client";

import { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2, Info, Maximize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./rules.module.css";
import { pinyin } from "pinyin-pro";

interface Rule {
  id: string;
  title: string;
  content: string;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Rule | null>(null);
  const [newItem, setNewItem] = useState({ title: "", content: "" });
  


  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("rules")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
      setRules([...(data || []), ...localData]);
    } catch (err) {
      console.error("Error fetching rules:", err);
      const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
      setRules(localData);
    } finally {
      setLoading(false);
    }
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

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = { ...newItem, id: `local-r-${Date.now()}` };
    const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
    localStorage.setItem("user_rules", JSON.stringify([...localData, entry]));
    
    setRules(prev => [...prev, entry]);
    setShowAddModal(false);
    setNewItem({ title: "", content: "" });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa quy tắc này?")) return;
    const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
    const updatedLocal = localData.filter((i: any) => i.id !== id);
    localStorage.setItem("user_rules", JSON.stringify(updatedLocal));
    setRules(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
    const updatedLocal = localData.map((i: any) => i.id === editingItem.id ? editingItem : i);
    localStorage.setItem("user_rules", JSON.stringify(updatedLocal));
    setRules(prev => prev.map(i => i.id === editingItem.id ? editingItem : i));
    setShowEditModal(false);
  };

  const renderTextWithPinyin = (text: string) => {
    return text.split(/([\u4e00-\u9fa5]+)/g).map((part, i) => {
      if (/[\u4e00-\u9fa5]/.test(part)) {
        const py = pinyin(part, { toneType: 'symbol' });
        return `${part} (${py})`;
      }
      return part;
    }).join("");
  };

  const renderTitle = (text: string) => {
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
      return <span key={i} style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>{part}</span>;
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quy tắc Tiếng Trung</h1>
        <p className={styles.subtitle}>Các quy tắc biến điệu, viết chữ và phát âm quan trọng.</p>
      </header>



      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.rulesTable}>
            <thead>
              <tr>
                <th className={styles.sttCell}>STT</th>
                <th>Nội dung (Bao gồm Hán tự)</th>
                <th>Ghi chú</th>
                <th className={styles.actionCell}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, index) => (
                <tr key={rule.id}>
                   <td className={styles.sttCell}>{index + 1}</td>
                   <td 
                    className={styles.ruleTitleCell}
                  >
                    {renderTitle(rule.title)}
                  </td>
                  <td className={styles.contentCell}>{renderTextWithPinyin(rule.content)}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.actionGroup}>
                      <button className={styles.iconBtn} onClick={() => { setEditingItem(rule); setShowEditModal(true); }} title="Sửa"><Edit2 size={18} /></button>
                      <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={(e) => handleDelete(rule.id, e)} title="Xóa"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rules.length === 0 && (
            <div className={styles.empty}>Chưa có quy tắc nào được lưu.</div>
          )}
        </div>
      )}

      {/* FAB Thêm nhanh */}
      <button className={styles.floatingAddBtn} onClick={() => setShowAddModal(true)} title="Thêm mới nhanh">
        <Plus size={28} />
      </button>

      {/* Edit Modal (Add/Edit) */}



      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{marginBottom:'2rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{margin:0}}>Thêm quy tắc mới</h2>
              <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddItem} className="form" style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
              <div className="formGroup" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Nội dung (Nhập chữ Hán hoặc văn bản...)</label>
                <textarea 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  onKeyDown={e => handleKeyDown(e, (val) => setNewItem({...newItem, title: val}), newItem.title)}
                  placeholder="Ví dụ: Quy tắc biến điệu Bù (不)..."
                  required 
                  style={{padding:'1rem', borderRadius:'10px', border:'1.5px solid var(--border)', minHeight:'120px'}}
                />
              </div>
              <div className="formGroup" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Ghi chú</label>
                <textarea 
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                  onKeyDown={e => handleKeyDown(e, (val) => setNewItem({...newItem, content: val}), newItem.content)}
                  placeholder="Giải thích, lưu ý thêm..."
                  style={{padding:'1rem', borderRadius:'10px', border:'1.5px solid var(--border)', minHeight:'100px'}}
                />
              </div>
              <button type="submit" className="btn-primary" style={{marginTop:'1rem', padding:'1rem'}}>Lưu quy tắc</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{marginBottom:'2rem', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{margin:0}}>Sửa quy tắc</h2>
              <button onClick={() => setShowEditModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdate} className="form" style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
              <div className="formGroup" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Nội dung</label>
                <textarea 
                  value={editingItem.title}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  onKeyDown={e => handleKeyDown(e, (val) => setEditingItem({...editingItem, title: val}), editingItem.title)}
                  required 
                  style={{padding:'1rem', borderRadius:'10px', border:'1.5px solid var(--border)', minHeight:'120px'}}
                />
              </div>
              <div className="formGroup" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Ghi chú</label>
                <textarea 
                  value={editingItem.content}
                  onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                  onKeyDown={e => handleKeyDown(e, (val) => setEditingItem({...editingItem, content: val}), editingItem.content)}
                  style={{padding:'1rem', borderRadius:'10px', border:'1.5px solid var(--border)', minHeight:'100px'}}
                />
              </div>
              <div style={{display:'flex', gap:'1rem', marginTop:'1.5rem'}}>
                <button type="submit" className="btn-primary" style={{flex:1}}>Cập nhật quy tắc</button>
                <button 
                  type="button" 
                  className={styles.iconBtn} 
                  style={{background:'#ef4444', color:'white', width:'auto', padding:'0 1rem', display:'flex', alignItems:'center', gap:'0.5rem'}}
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

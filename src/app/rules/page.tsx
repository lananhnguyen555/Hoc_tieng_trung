"use client";

import { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2, Info, Maximize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./rules.module.css";

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
  
  // State for Fullscreen display
  const [fullScreenItem, setFullScreenItem] = useState<Rule | null>(null);

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quy tắc Tiếng Trung</h1>
        <p className={styles.subtitle}>Các quy tắc biến điệu, viết chữ và phát âm quan trọng.</p>
      </header>

      <div className={styles.addBtnWrapper}>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={24} /> Thêm quy tắc
        </button>
      </div>

      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.rulesTable}>
            <thead>
              <tr>
                <th className={styles.sttCell}>STT</th>
                <th>Tiêu đề (Hán tự)</th>
                <th>Nội dung hướng dẫn</th>
                <th className={styles.actionCell}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, index) => (
                <tr key={rule.id}>
                  <td className={styles.sttCell}>{index + 1}</td>
                  <td 
                    className={`${styles.ruleTitleCell} hanzi`}
                    onClick={() => setFullScreenItem(rule)}
                    title="Nhấn để phóng to chữ Hán"
                  >
                    {rule.title}
                  </td>
                  <td className={styles.contentCell}>{rule.content}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.actionGroup}>
                      <button className={styles.iconBtn} onClick={() => { setEditingItem(rule); setShowEditModal(true); }}>
                        <Edit2 size={18} />
                      </button>
                      <button className={styles.iconBtn} onClick={(e) => handleDelete(rule.id, e)}>
                        <Trash2 size={18} />
                      </button>
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

      {/* Fullscreen Hanzi display for Rules */}
      {fullScreenItem && (
        <div className={styles.fullscreenOverlay} onClick={() => setFullScreenItem(null)}>
          <div className={`${styles.fullscreenHanzi} hanzi`}>
            {fullScreenItem.title.match(/[\u4e00-\u9fa5]+/g)?.[0] || fullScreenItem.title}
          </div>
          <div style={{marginTop:'2rem', textAlign:'center'}}>
            <h2 style={{fontSize:'2.5rem'}}>{fullScreenItem.title}</h2>
            <p>Nhấp vào bất kỳ đâu để đóng</p>
          </div>
        </div>
      )}

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
                <label style={{fontWeight:700}}>Tiêu đề (Hán tự)</label>
                <input 
                  type="text" 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="Ví dụ: Quy tắc biến điệu Bù (不)"
                  required 
                  style={{padding:'1rem', borderRadius:'10px', border:'1.5px solid var(--border)'}}
                />
              </div>
              <div className="formGroup" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Nội dung hướng dẫn</label>
                <textarea 
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                  placeholder="Cách sử dụng, các trường hợp biến điệu..."
                  required 
                  style={{padding:'1rem', borderRadius:'10px', border:'1.5px solid var(--border)', minHeight:'150px'}}
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
                <label style={{fontWeight:700}}>Tiêu đề (Hán tự)</label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  required 
                  style={{padding:'1rem', borderRadius:'10px', border:'1.5px solid var(--border)'}}
                />
              </div>
              <div className="formGroup" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                <label style={{fontWeight:700}}>Nội dung hướng dẫn</label>
                <textarea 
                  value={editingItem.content}
                  onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                  required 
                  style={{padding:'1rem', borderRadius:'10px', border:'1.5px solid var(--border)', minHeight:'150px'}}
                />
              </div>
              <button type="submit" className="btn-primary" style={{marginTop:'1rem', padding:'1rem'}}>Cập nhật quy tắc</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

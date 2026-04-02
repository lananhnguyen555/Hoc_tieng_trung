"use client";

import { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2, Info, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./rules.module.css";

interface RuleItem {
  id: string;
  title: string;
  content: string;
}

export default function RulesPage() {
  const [rulesList, setRulesList] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RuleItem | null>(null);
  const [newItem, setNewItem] = useState({ title: "", content: "" });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
      setRulesList([...(data || []), ...localData]);
    } catch (err) {
      console.error("Error fetching rules:", err);
      const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
      setRulesList(localData);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = { ...newItem, id: `local-r-${Date.now()}` };
    const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
    localStorage.setItem("user_rules", JSON.stringify([...localData, entry]));
    
    setRulesList(prev => [entry, ...prev]);
    setShowAddModal(false);
    setNewItem({ title: "", content: "" });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Xóa quy tắc này?")) return;
    const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
    const updatedLocal = localData.filter((i: any) => i.id !== id);
    localStorage.setItem("user_rules", JSON.stringify(updatedLocal));
    setRulesList(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const localData = JSON.parse(localStorage.getItem("user_rules") || "[]");
    const updatedLocal = localData.map((i: any) => i.id === editingItem.id ? editingItem : i);
    localStorage.setItem("user_rules", JSON.stringify(updatedLocal));
    setRulesList(prev => prev.map(i => i.id === editingItem.id ? editingItem : i));
    setShowEditModal(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quy tắc học tập</h1>
        <p className={styles.subtitle}>Những lưu ý và quy chuẩn quan trọng khi bắt đầu học tiếng Trung.</p>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> Thêm quy tắc
        </button>
      </header>

      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.list}>
          {rulesList.map((rule) => (
            <div key={rule.id} className={`card ${styles.ruleCard}`}>
              <div className={styles.icon}>
                <Info size={24} />
              </div>
              <div className={styles.content}>
                <h3 className="hanzi">{rule.title}</h3>
                <p>{rule.content}</p>
              </div>

              <div className={styles.cardActions}>
                <button onClick={() => { setEditingItem(rule); setShowEditModal(true); }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(rule.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {rulesList.length === 0 && (
            <div className={styles.empty}>Chưa có quy tắc học tập nào. Hãy thêm ngay!</div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Thêm quy tắc mới</h2>
              <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAddItem} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Tiêu đề</label>
                <input 
                  type="text" 
                  value={newItem.title}
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  placeholder="Ví dụ: Quy tắc viết chữ Hán"
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nội dung</label>
                <textarea 
                  value={newItem.content}
                  onChange={e => setNewItem({...newItem, content: e.target.value})}
                  placeholder="Từ trái sang phải, từ trên xuống dưới..."
                  required 
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
              <h2>Sửa quy tắc</h2>
              <button onClick={() => setShowEditModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdate} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Tiêu đề</label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={e => setEditingItem({...editingItem, title: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nội dung</label>
                <textarea 
                  value={editingItem.content}
                  onChange={e => setEditingItem({...editingItem, content: e.target.value})}
                  required 
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

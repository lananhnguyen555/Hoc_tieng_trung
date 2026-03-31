"use client";

import { useState, useRef } from "react";
import { FileUp, Download, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import styles from "./import.module.css";
import Link from "next/link";

export default function UserImportPage() {
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const localData = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [word, pinyin, meaning] = line.split(",").map(s => s.trim());
        if (word && pinyin && meaning) {
          localData.push({ word, pinyin, meaning });
        }
      }

      // Save to localStorage for personal study
      const existing = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      const updated = [...existing, ...localData];
      localStorage.setItem("user_vocab", JSON.stringify(updated));
      
      setImportedCount(localData.length);
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "hanzi,pinyin,meaning\n学习,xuéxí,Học tập\n老师,lǎoshī,Giáo viên";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "my_vocab_template.csv");
    link.click();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tự tạo kho từ vựng</h1>
        <p className={styles.subtitle}>Tải lên file của riêng bạn để luyện tập Flashcards và Quiz cá nhân.</p>
      </header>

      <div className={styles.content}>
        {importedCount > 0 ? (
          <div className={`card ${styles.successCard}`}>
            <CheckCircle2 size={48} color="#22c55e" />
            <h2>Thành công!</h2>
            <p>Đã nhập **{importedCount}** từ vào kho lưu trữ cá nhân của bạn.</p>
            <div className={styles.ctas}>
              <Link href="/study/flashcards" className="btn-primary">
                Luyện tập ngay <ChevronRight size={18} />
              </Link>
              <button className={styles.secondaryBtn} onClick={() => setImportedCount(0)}>
                Nhập thêm file khác
              </button>
            </div>
          </div>
        ) : (
          <div className={`card ${styles.importCard}`}>
            <div className={styles.info}>
              <BookOpen size={40} color="var(--primary)" />
              <h3>Bạn muốn học từ vựng riêng?</h3>
              <p>Hệ thống hỗ trợ bạn tải lên danh sách từ vựng cá nhân để tự ôn tập mà không ảnh hưởng đến người khác.</p>
            </div>

            <div className={styles.actions}>
              <button className={styles.templateBtn} onClick={downloadTemplate}>
                <Download size={18} /> Tải file mẫu CSV
              </button>
              
              <button 
                className={styles.mainBtn} 
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <FileUp size={20} /> {importing ? "Đang xử lý..." : "Chọn file CSV của bạn"}
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className={styles.hidden}
                accept=".csv"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

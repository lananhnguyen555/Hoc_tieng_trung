"use client";

import { useState, useEffect } from "react";
import { Search, BookOpen, GraduationCap, Scale, MessageCircle } from "lucide-react";
import styles from "../vocab.module.css";
import { supabase } from "@/lib/supabase";
import { pinyin } from "pinyin-pro";

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  word_type: string;
  lesson_id: string;
}

export default function VocabSummaryPage() {
  const [vocab, setVocab] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dbVocab } = await supabase.from("vocab").select("*");
      const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      setVocab([...(dbVocab || []), ...localVocab]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVocab = vocab.filter(v => 
    v.word.includes(search) || 
    v.meaning.toLowerCase().includes(search.toLowerCase()) ||
    v.pinyin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng hợp Từ vựng</h1>
        <p className={styles.subtitle}>Xem toàn bộ danh sách {vocab.length} từ vựng từ tất cả các bài học.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm từ vựng, pinyin hoặc nghĩa..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.vocabTable}>
            <thead>
              <tr>
                <th style={{width: '60px'}}>STT</th>
                <th>Hán tự</th>
                <th>Pinyin</th>
                <th>Nghĩa tiếng Việt</th>
                <th>Loại từ</th>
              </tr>
            </thead>
            <tbody>
              {filteredVocab.map((item, index) => (
                <tr key={item.id}>
                  <td style={{textAlign: 'center', fontWeight: 'bold'}}>{index + 1}</td>
                  <td>
                    <span className="hanzi" style={{fontSize: '2rem'}}>{item.word}</span>
                  </td>
                  <td style={{fontWeight: '800'}}>({item.pinyin})</td>
                  <td style={{fontWeight: '800'}}>{item.meaning}</td>
                  <td>
                    <span className={styles.typeBadge}>{item.word_type || 'N/A'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVocab.length === 0 && (
            <div className={styles.empty}>Không tìm thấy từ vựng nào.</div>
          )}
        </div>
      )}
    </div>
  );
}

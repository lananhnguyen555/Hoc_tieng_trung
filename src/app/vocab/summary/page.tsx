"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download } from "lucide-react";
import styles from "../vocab.module.css";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import ColumnSettings, { ColConfig } from "@/components/ColumnSettings";

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  word_type: string;
  lesson_id: string;
}

const DEFAULT_COLS: ColConfig[] = [
  { key: "stt",     label: "STT",               width: 5,   unit: "%",  min: 3,  max: 10  },
  { key: "hanzi",   label: "Hán tự",             width: 20,  unit: "%",  min: 10, max: 35  },
  { key: "pinyin",  label: "Pinyin",             width: 14,  unit: "%",  min: 8,  max: 30  },
  { key: "loaitu",  label: "Loại từ",            width: 130, unit: "px", min: 70, max: 220 },
  { key: "padding", label: "Khoảng cách → Nghĩa", width: 80,  unit: "px", min: 0,  max: 200 },
];

export default function VocabSummaryPage() {
  const [vocab, setVocab]                       = useState<Word[]>([]);
  const [lessons, setLessons]                   = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("all");
  const [loading, setLoading]                   = useState(true);
  const [search, setSearch]                     = useState("");
  const [cols, setCols]                         = useState<ColConfig[]>(DEFAULT_COLS);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dbVocab }   = await supabase.from("vocab").select("*");
      const localVocab          = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      setVocab([...(dbVocab || []), ...localVocab]);
      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons        = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      setLessons([...(dbLessons || []), ...localLessons]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExportExcel = () => {
    const rows = filteredVocab.map((v, i) => ({
      STT: i + 1, "Hán tự": v.word, Pinyin: v.pinyin,
      "Nghĩa Việt": v.meaning, "Loại từ": v.word_type || "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Từ vựng");
    let fn = "Tong_hop_tu_vung.xlsx";
    if (selectedLessonId !== "all") {
      const n = lessons.find(l => l.id === selectedLessonId)?.name || "Buoi";
      fn = `${n.replace(/\s+/g, "_")}_tu_vung.xlsx`;
    }
    XLSX.writeFile(wb, fn);
  };

  const handleColsChange = useCallback((updated: ColConfig[]) => setCols(updated), []);

  const col = (key: string) => cols.find(c => c.key === key)!;
  const w   = (key: string) => `${col(key).width}${col(key).unit}`;

  let filteredVocab = vocab.filter(v =>
    v.word.includes(search) ||
    v.meaning.toLowerCase().includes(search.toLowerCase()) ||
    v.pinyin.toLowerCase().includes(search.toLowerCase())
  );
  if (selectedLessonId !== "all")
    filteredVocab = filteredVocab.filter(v => v.lesson_id === selectedLessonId);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng hợp Từ vựng</h1>
        <p className={styles.subtitle}>Xem toàn bộ danh sách {vocab.length} từ vựng.</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input type="text" placeholder="Tìm kiếm từ vựng, pinyin hoặc nghĩa..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
          {/* Lọc buổi học */}
          <div className={styles.selectGroup} style={{ border:"1px solid var(--border)", borderRadius:"8px", padding:"0.2rem 1rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <Filter size={18} />
            <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)}
              style={{ border:"none", background:"none", padding:"0.5rem", fontWeight:600, outline:"none" }}>
              <option value="all">Tất cả bài học</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* Xuất Excel */}
          <button className={styles.addBtn} onClick={handleExportExcel}
            style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <Download size={18} /> Xuất Excel
          </button>

          {/* Điều chỉnh cột (chỉ Admin) */}
          <ColumnSettings
            storageKey="col_summary"
            defaultCols={DEFAULT_COLS}
            onChange={handleColsChange}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.vocabTable} style={{ tableLayout:"fixed", width:"100%" }}>
            <colgroup>
              <col style={{ width: w("stt")    }} />
              <col style={{ width: w("hanzi")  }} />
              <col style={{ width: w("pinyin") }} />
              <col style={{ width: w("loaitu") }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign:"center" }}>STT</th>
                <th>Hán tự</th>
                <th>Pinyin</th>
                <th style={{ textAlign:"center" }}>Loại từ</th>
                <th style={{ paddingLeft:`${col("padding").width}px` }}>Nghĩa tiếng Việt</th>
              </tr>
            </thead>
            <tbody>
              {filteredVocab.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ textAlign:"center", color:"#94a3b8", fontWeight:700 }}>{index + 1}</td>
                  <td><span className="hanzi" style={{ fontSize:"2.5rem" }}>{item.word}</span></td>
                  <td style={{ fontWeight:700, color:"#6366f1", fontSize:"0.92rem" }}>{item.pinyin}</td>
                  <td style={{ textAlign:"center", paddingRight:"1rem" }}>
                    <span className={styles.typeBadge}>{item.word_type || "N/A"}</span>
                  </td>
                  <td style={{ fontWeight:600, paddingLeft:`${col("padding").width}px` }}>{item.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVocab.length === 0 && <div className={styles.empty}>Không tìm thấy từ vựng nào.</div>}
        </div>
      )}
    </div>
  );
}

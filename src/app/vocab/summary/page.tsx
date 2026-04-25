"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download, Settings2, X, SlidersHorizontal } from "lucide-react";
import styles from "../vocab.module.css";
import colStyles from "./summarySettings.module.css";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth-utils";
import * as XLSX from "xlsx";

interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  word_type: string;
  lesson_id: string;
}

// Cấu hình cột mặc định
const DEFAULT_COLS = {
  stt:     { label: "STT",              width: 5,    unit: "%",  min: 3,   max: 10  },
  hanzi:   { label: "Hán tự",           width: 20,   unit: "%",  min: 10,  max: 35  },
  pinyin:  { label: "Pinyin",           width: 14,   unit: "%",  min: 8,   max: 30  },
  loaitu:  { label: "Loại từ (px)",     width: 130,  unit: "px", min: 70,  max: 220 },
  padding: { label: "Cách trước Nghĩa", width: 80,   unit: "px", min: 0,   max: 200 },
};

type ColKey = keyof typeof DEFAULT_COLS;

const STORAGE_KEY = "summary_col_settings";

export default function VocabSummaryPage() {
  const [vocab, setVocab]                       = useState<Word[]>([]);
  const [lessons, setLessons]                   = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("all");
  const [loading, setLoading]                   = useState(true);
  const [search, setSearch]                     = useState("");
  const [adminUser, setAdminUser]               = useState(false);
  const [showSettings, setShowSettings]         = useState(false);
  const [cols, setCols]                         = useState(DEFAULT_COLS);

  useEffect(() => {
    fetchData();
    // Kiểm tra admin
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminUser(isAdmin(session?.user?.email));
    });
    // Tải cài đặt đã lưu
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setCols(JSON.parse(saved)); } catch {}
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dbVocab }   = await supabase.from("vocab").select("*");
      const localVocab          = JSON.parse(localStorage.getItem("user_vocab") || "[]");
      setVocab([...(dbVocab || []), ...localVocab]);

      const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
      const localLessons        = JSON.parse(localStorage.getItem("user_lessons") || "[]");
      setLessons([...(dbLessons || []), ...localLessons]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredVocab.map((v, i) => ({
      STT: i + 1,
      "Hán tự": v.word,
      Pinyin: v.pinyin,
      "Nghĩa Việt": v.meaning,
      "Loại từ": v.word_type || "N/A",
    }));
    const ws  = XLSX.utils.json_to_sheet(dataToExport);
    const wb  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Từ vựng");
    let fileName = "Tong_hop_tu_vung.xlsx";
    if (selectedLessonId !== "all") {
      const name = lessons.find(l => l.id === selectedLessonId)?.name || "Buoi_hoc";
      fileName = `${name.replace(/\s+/g, "_")}_tu_vung.xlsx`;
    }
    XLSX.writeFile(wb, fileName);
  };

  // Slider thay đổi cột
  const handleColChange = (key: ColKey, value: number) => {
    const next = { ...cols, [key]: { ...cols[key], width: value } };
    setCols(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleReset = () => {
    setCols(DEFAULT_COLS);
    localStorage.removeItem(STORAGE_KEY);
  };

  let filteredVocab = vocab.filter(v =>
    v.word.includes(search) ||
    v.meaning.toLowerCase().includes(search.toLowerCase()) ||
    v.pinyin.toLowerCase().includes(search.toLowerCase())
  );
  if (selectedLessonId !== "all") {
    filteredVocab = filteredVocab.filter(v => v.lesson_id === selectedLessonId);
  }

  const w = (key: ColKey) => `${cols[key].width}${cols[key].unit}`;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tổng hợp Từ vựng</h1>
        <p className={styles.subtitle}>
          Xem toàn bộ danh sách {vocab.length} từ vựng từ tất cả các bài học.
        </p>
      </header>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm từ vựng, pinyin hoặc nghĩa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
          <div className={styles.selectGroup} style={{ border:"1px solid var(--border)", borderRadius:"8px", padding:"0.2rem 1rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <Filter size={18} />
            <select
              value={selectedLessonId}
              onChange={e => setSelectedLessonId(e.target.value)}
              style={{ border:"none", background:"none", padding:"0.5rem", fontWeight:600, outline:"none" }}
            >
              <option value="all">Tất cả bài học</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <button className={styles.addBtn} onClick={handleExportExcel} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <Download size={18} /> Xuất Excel
          </button>

          {/* Nút cài đặt - CHỈ ADMIN */}
          {adminUser && (
            <button
              className={colStyles.settingsBtn}
              onClick={() => setShowSettings(s => !s)}
              title="Điều chỉnh cột (Admin)"
            >
              <SlidersHorizontal size={18} />
              Cột
            </button>
          )}
        </div>
      </div>

      {/* Panel cài đặt cột - chỉ admin */}
      {adminUser && showSettings && (
        <div className={colStyles.settingsPanel}>
          <div className={colStyles.panelHeader}>
            <div className={colStyles.panelTitle}>
              <Settings2 size={18} /> Điều chỉnh độ rộng cột
            </div>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button className={colStyles.resetBtn} onClick={handleReset}>Mặc định</button>
              <button className={colStyles.closeBtn} onClick={() => setShowSettings(false)}><X size={18}/></button>
            </div>
          </div>

          <div className={colStyles.sliders}>
            {(Object.keys(cols) as ColKey[]).map(key => (
              <div key={key} className={colStyles.sliderRow}>
                <label className={colStyles.sliderLabel}>
                  <span>{cols[key].label}</span>
                  <span className={colStyles.sliderValue}>{cols[key].width}{cols[key].unit}</span>
                </label>
                <input
                  type="range"
                  min={cols[key].min}
                  max={cols[key].max}
                  value={cols[key].width}
                  onChange={e => handleColChange(key, Number(e.target.value))}
                  className={colStyles.slider}
                />
                <div className={colStyles.sliderRange}>
                  <span>{cols[key].min}{cols[key].unit}</span>
                  <span>{cols[key].max}{cols[key].unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <th style={{ paddingLeft: `${cols.padding.width}px` }}>Nghĩa tiếng Việt</th>
              </tr>
            </thead>
            <tbody>
              {filteredVocab.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ textAlign:"center", color:"#94a3b8", fontWeight:700 }}>{index + 1}</td>
                  <td>
                    <span className="hanzi" style={{ fontSize:"2.5rem" }}>{item.word}</span>
                  </td>
                  <td style={{ fontWeight:700, color:"#6366f1", fontSize:"0.92rem" }}>{item.pinyin}</td>
                  <td style={{ textAlign:"center", paddingRight:"1rem" }}>
                    <span className={styles.typeBadge}>{item.word_type || "N/A"}</span>
                  </td>
                  <td style={{ fontWeight:600, paddingLeft: `${cols.padding.width}px` }}>{item.meaning}</td>
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

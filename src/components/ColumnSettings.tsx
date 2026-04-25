"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, X, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth-utils";
import styles from "./ColumnSettings.module.css";

export interface ColConfig {
  key: string;
  label: string;
  width: number;
  unit: "%" | "px";
  min: number;
  max: number;
  step?: number;
}

interface ColumnSettingsProps {
  storageKey: string;              // Key duy nhất cho từng trang
  defaultCols: ColConfig[];        // Cấu hình mặc định
  onChange: (cols: ColConfig[]) => void; // Callback khi thay đổi
}

export default function ColumnSettings({ storageKey, defaultCols, onChange }: ColumnSettingsProps) {
  const [isAdmin_, setIsAdmin_] = useState(false);
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState<ColConfig[]>(defaultCols);

  // Check admin + load saved settings
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin_(isAdmin(session?.user?.email));
    });

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: ColConfig[] = JSON.parse(saved);
        // Merge saved values vào defaultCols (đề phòng default thay đổi)
        const merged = defaultCols.map(d => {
          const s = parsed.find(p => p.key === d.key);
          return s ? { ...d, width: s.width } : d;
        });
        setCols(merged);
        onChange(merged);
      } catch {}
    } else {
      onChange(defaultCols);
    }
  }, [storageKey]);

  const handleChange = useCallback((key: string, value: number) => {
    setCols(prev => {
      const next = prev.map(c => c.key === key ? { ...c, width: value } : c);
      localStorage.setItem(storageKey, JSON.stringify(next));
      onChange(next);
      return next;
    });
  }, [storageKey, onChange]);

  const handleReset = () => {
    setCols(defaultCols);
    localStorage.removeItem(storageKey);
    onChange(defaultCols);
  };

  if (!isAdmin_) return null;

  return (
    <div className={styles.wrapper}>
      {/* Toggle button */}
      <button className={styles.toggleBtn} onClick={() => setOpen(o => !o)}>
        <SlidersHorizontal size={16} />
        <span>Điều chỉnh cột</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Panel */}
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>⚙️ Cài đặt độ rộng cột <span className={styles.adminTag}>Admin</span></span>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button className={styles.resetBtn} onClick={handleReset}>
                <RotateCcw size={13}/> Mặc định
              </button>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>
                <X size={16}/>
              </button>
            </div>
          </div>

          <div className={styles.colList}>
            {cols.map((col, idx) => (
              <div key={col.key} className={styles.colRow}>
                {/* Số thứ tự + tên */}
                <div className={styles.colMeta}>
                  <span className={styles.colIdx}>{idx + 1}</span>
                  <span className={styles.colLabel}>{col.label}</span>
                </div>

                {/* Slider */}
                <div className={styles.sliderGroup}>
                  <span className={styles.sliderMin}>{col.min}{col.unit}</span>
                  <input
                    type="range"
                    min={col.min}
                    max={col.max}
                    step={col.step ?? 1}
                    value={col.width}
                    onChange={e => handleChange(col.key, Number(e.target.value))}
                    className={styles.slider}
                  />
                  <span className={styles.sliderMax}>{col.max}{col.unit}</span>
                </div>

                {/* Giá trị hiện tại */}
                <div className={styles.colValue}>
                  {col.width}<span className={styles.colUnit}>{col.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

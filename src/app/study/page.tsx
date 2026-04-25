"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useVocabData } from "@/hooks/useVocabData";
import { getProgress, MASTERY_THRESHOLD_VALUE } from "@/lib/srs";
import styles from "./study.module.css";

export default function StudyHubPage() {
  const { vocab, loading } = useVocabData();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    setSessions(JSON.parse(localStorage.getItem("study_sessions") || "[]"));
  }, []);

  const mastered = vocab.filter(v => getProgress(v.id).score >= MASTERY_THRESHOLD_VALUE).length;
  const avgProgress = vocab.length > 0
    ? Math.round(vocab.reduce((s, v) => s + getProgress(v.id).score, 0) / vocab.length)
    : 0;

  const modes = [
    {
      href: "/study/flashcards",
      icon: "🗃️",
      title: "Flashcard",
      desc: "Lật thẻ, đánh giá Biết / Chưa biết",
      color: "linear-gradient(135deg,#667eea,#764ba2)",
      badge: "SRS",
    },
    {
      href: "/study/quiz",
      icon: "📝",
      title: "Quiz Trắc nghiệm",
      desc: "4 đáp án + nhận dạng giọng nói",
      color: "linear-gradient(135deg,#0ea5e9,#0284c7)",
      badge: "AI Voice",
    },
    {
      href: "/study/listening",
      icon: "🎤",
      title: "Nghe & Nhắc lại",
      desc: "Nghe từ → Phát âm → Chấm điểm",
      color: "linear-gradient(135deg,#ec4899,#be185d)",
      badge: "Phát âm",
    },
    {
      href: "/study/writing",
      icon: "✍️",
      title: "Bài kiểm tra viết",
      desc: "Gõ Pinyin hoặc Hán tự từ gợi ý",
      color: "linear-gradient(135deg,#7c3aed,#5b21b6)",
      badge: "Typing",
    },
    {
      href: "/study/history",
      icon: "📊",
      title: "Lịch sử & Thống kê",
      desc: "Tiến độ, chuỗi ngày, biểu đồ",
      color: "linear-gradient(135deg,#f59e0b,#d97706)",
      badge: "Stats",
    },
  ];

  return (
    <div className={styles.hubContainer}>
      <header className={styles.hubHeader}>
        <h1>🎓 Trung tâm Ôn tập</h1>
        <p>Chọn chế độ học để bắt đầu!</p>
      </header>

      {/* Quick stats */}
      <div className={styles.hubStats}>
        <div className={styles.hubStat}>
          <span className={styles.hubStatValue}>{vocab.length}</span>
          <span className={styles.hubStatLabel}>Tổng từ</span>
        </div>
        <div className={styles.hubStat}>
          <span className={styles.hubStatValue} style={{color:'#22c55e'}}>{mastered}</span>
          <span className={styles.hubStatLabel}>Thành thạo</span>
        </div>
        <div className={styles.hubStat}>
          <span className={styles.hubStatValue} style={{color:'#0ea5e9'}}>{avgProgress}%</span>
          <span className={styles.hubStatLabel}>Tiến độ TB</span>
        </div>
        <div className={styles.hubStat}>
          <span className={styles.hubStatValue} style={{color:'#f59e0b'}}>{sessions.length}</span>
          <span className={styles.hubStatLabel}>Bài đã làm</span>
        </div>
      </div>

      {/* Mode cards */}
      <div className={styles.modeGrid}>
        {modes.map(m => (
          <Link key={m.href} href={m.href} className={styles.modeCard} style={{ background: m.color }}>
            <div className={styles.modeBadge}>{m.badge}</div>
            <div className={styles.modeIcon}>{m.icon}</div>
            <h3 className={styles.modeTitle}>{m.title}</h3>
            <p className={styles.modeDesc}>{m.desc}</p>
          </Link>
        ))}
      </div>

      {/* Mastery progress */}
      {vocab.length > 0 && (
        <div className={styles.masterySection}>
          <div className={styles.masteryHeader}>
            <span>Mức độ thành thạo tổng thể</span>
            <span style={{fontWeight:700, color: avgProgress >= 85 ? '#22c55e' : '#f59e0b'}}>{avgProgress}%</span>
          </div>
          <div className={styles.masteryTrack}>
            <div className={styles.masteryFill} style={{width:`${avgProgress}%`}} />
            <div className={styles.masteryThreshold} style={{left:'85%'}} title="Ngưỡng thành thạo 85%" />
          </div>
          <p className={styles.masteryHint}>Đạt &gt;85% để được coi là thành thạo · {mastered}/{vocab.length} từ đạt ngưỡng</p>
        </div>
      )}
    </div>
  );
}

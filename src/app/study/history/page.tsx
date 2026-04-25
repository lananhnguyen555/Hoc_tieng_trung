"use client";

import { useState, useEffect } from "react";
import { useVocabData, Word } from "@/hooks/useVocabData";
import { getProgress, MASTERY_THRESHOLD_VALUE } from "@/lib/srs";
import { Star, BarChart2, Calendar, Award, TrendingUp, Clock } from "lucide-react";
import styles from "./history.module.css";

interface Session {
  type: string;
  lessonId: string;
  score: number;
  total: number;
  durationSeconds: number;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  flashcard: "🗃️ Flashcard",
  quiz: "📝 Quiz",
  writing: "✍️ Viết",
  speaking: "🎤 Nói",
};

export default function HistoryPage() {
  const { vocab, loading } = useVocabData();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const data: Session[] = JSON.parse(localStorage.getItem("study_sessions") || "[]");
    setSessions(data.slice().reverse()); // Mới nhất trước

    // Tính streak
    const days = new Set(data.map(s => s.created_at.slice(0, 10)));
    let count = 0;
    let d = new Date();
    while (days.has(d.toISOString().slice(0, 10))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    setStreak(count);
  }, []);

  const mastered = vocab.filter(v => getProgress(v.id).score >= MASTERY_THRESHOLD_VALUE).length;
  const avgProgress = vocab.length > 0
    ? Math.round(vocab.reduce((s, v) => s + getProgress(v.id).score, 0) / vocab.length)
    : 0;

  // Số buổi 7 ngày gần nhất
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const count = sessions.filter(s => s.created_at.slice(0, 10) === dateStr).length;
    return { date: dateStr, label: d.toLocaleDateString("vi-VN", { weekday: "short" }), count };
  });
  const maxCount = Math.max(...last7.map(d => d.count), 1);

  const formatDur = (s: number) => s < 60 ? `${s}s` : `${Math.round(s/60)}p`;

  return (
    <div className={styles.container}>
      <header className={styles.header}><h1>📊 Lịch sử & Thống kê</h1></header>

      {/* Stats cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}><TrendingUp size={22}/></div>
          <div className={styles.statValue}>{avgProgress}%</div>
          <div className={styles.statLabel}>Tiến độ TB</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background:'linear-gradient(135deg,#22c55e,#16a34a)'}}><Award size={22}/></div>
          <div className={styles.statValue}>{mastered}</div>
          <div className={styles.statLabel}>Từ thành thạo</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background:'linear-gradient(135deg,#0ea5e9,#0284c7)'}}><BarChart2 size={22}/></div>
          <div className={styles.statValue}>{sessions.length}</div>
          <div className={styles.statLabel}>Phiên học</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}><Calendar size={22}/></div>
          <div className={styles.statValue}>{streak} 🔥</div>
          <div className={styles.statLabel}>Chuỗi ngày</div>
        </div>
      </div>

      {/* Activity chart */}
      <div className={styles.chartCard}>
        <h3>Hoạt động 7 ngày gần nhất</h3>
        <div className={styles.barChart}>
          {last7.map(d => (
            <div key={d.date} className={styles.barCol}>
              <div className={styles.barWrapper}>
                <div
                  className={styles.bar}
                  style={{ height: `${Math.round((d.count / maxCount) * 100)}%`, minHeight: d.count > 0 ? '8px' : '2px' }}
                  title={`${d.count} phiên`}
                />
              </div>
              <div className={styles.barLabel}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SRS progress by vocab */}
      <div className={styles.srsCard}>
        <h3>Tiến độ từng từ ({vocab.length} từ)</h3>
        {loading ? <p>Đang tải...</p> : vocab.length === 0 ? <p style={{color:'#9ca3af'}}>Chưa có từ vựng</p> : (
          <div className={styles.srsGrid}>
            {vocab.slice(0, 30).map(v => {
              const p = getProgress(v.id);
              return (
                <div key={v.id} className={styles.srsItem} title={`${v.word} - ${v.meaning}: ${p.score}%`}>
                  <div className={styles.srsWord}>{v.word}</div>
                  <div className={styles.srsBarTrack}>
                    <div className={`${styles.srsBar} ${p.score >= 85 ? styles.mastered : p.score >= 50 ? styles.medium : styles.weak}`}
                      style={{width:`${p.score}%`}} />
                  </div>
                  <div className={styles.srsPct}>{p.score}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className={styles.sessionsCard}>
        <h3>Lịch sử phiên học gần đây</h3>
        {sessions.length === 0 ? (
          <p style={{color:'#9ca3af', textAlign:'center', padding:'2rem'}}>Chưa có phiên học nào. Bắt đầu học thôi!</p>
        ) : (
          <div className={styles.sessionList}>
            {sessions.slice(0, 20).map((s, i) => {
              const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
              return (
                <div key={i} className={styles.sessionRow}>
                  <div className={styles.sessionType}>{TYPE_LABEL[s.type] || s.type}</div>
                  <div className={`${styles.sessionPct} ${pct >= 85 ? styles.good : pct >= 60 ? styles.ok : styles.bad}`}>{pct}%</div>
                  <div className={styles.sessionDetail}>{s.score}/{s.total} câu</div>
                  <div className={styles.sessionTime}><Clock size={13}/> {formatDur(s.durationSeconds)}</div>
                  <div className={styles.sessionDate}>{new Date(s.created_at).toLocaleDateString("vi-VN")}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

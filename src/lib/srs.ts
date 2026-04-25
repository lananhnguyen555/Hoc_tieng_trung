import { supabase } from "./supabase";

export interface VocabProgress {
  vocab_id: string;
  score: number;        // 0–100
  review_count: number;
  correct_count: number;
  last_reviewed: string;
}

const LOCAL_KEY = "srs_progress";
const SCORE_CORRECT = 12;
const SCORE_WRONG = -18;
const MASTERY_THRESHOLD = 85;

// Đọc toàn bộ progress từ localStorage
function getLocalProgress(): Record<string, VocabProgress> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
  } catch { return {}; }
}

// Lưu progress vào localStorage
function saveLocalProgress(data: Record<string, VocabProgress>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

// Lấy progress của 1 từ
export function getProgress(vocabId: string): VocabProgress {
  const all = getLocalProgress();
  return all[vocabId] ?? {
    vocab_id: vocabId,
    score: 0,
    review_count: 0,
    correct_count: 0,
    last_reviewed: new Date().toISOString(),
  };
}

// Cập nhật progress sau khi trả lời
export async function updateProgress(vocabId: string, correct: boolean): Promise<VocabProgress> {
  const all = getLocalProgress();
  const prev = all[vocabId] ?? { vocab_id: vocabId, score: 0, review_count: 0, correct_count: 0, last_reviewed: "" };

  const newScore = Math.max(0, Math.min(100, prev.score + (correct ? SCORE_CORRECT : SCORE_WRONG)));
  const updated: VocabProgress = {
    vocab_id: vocabId,
    score: newScore,
    review_count: prev.review_count + 1,
    correct_count: prev.correct_count + (correct ? 1 : 0),
    last_reviewed: new Date().toISOString(),
  };

  all[vocabId] = updated;
  saveLocalProgress(all);

  // Sync lên Supabase nếu đăng nhập
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from("vocab_progress").upsert({
        user_id: session.user.id,
        vocab_id: vocabId,
        score: newScore,
        review_count: updated.review_count,
        correct_count: updated.correct_count,
        last_reviewed: updated.last_reviewed,
      }, { onConflict: "user_id,vocab_id" });
    }
  } catch { /* Ignore sync errors */ }

  return updated;
}

// Load progress từ Supabase và merge vào localStorage
export async function syncProgressFromCloud() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase.from("vocab_progress").select("*");
    if (!data) return;
    const all = getLocalProgress();
    for (const row of data) {
      all[row.vocab_id] = {
        vocab_id: row.vocab_id,
        score: row.score,
        review_count: row.review_count,
        correct_count: row.correct_count,
        last_reviewed: row.last_reviewed,
      };
    }
    saveLocalProgress(all);
  } catch { /* Ignore */ }
}

// Kiểm tra từ đã thành thạo chưa (>85%)
export function isMastered(vocabId: string): boolean {
  return getProgress(vocabId).score >= MASTERY_THRESHOLD;
}

// Lấy danh sách từ cần ôn tập (ưu tiên từ điểm thấp)
export function sortByPriority<T extends { id: string }>(vocab: T[]): T[] {
  const all = getLocalProgress();
  return [...vocab].sort((a, b) => {
    const sa = all[a.id]?.score ?? 0;
    const sb = all[b.id]?.score ?? 0;
    return sa - sb; // Điểm thấp lên đầu
  });
}

// Tính điểm trung bình của 1 buổi học
export function getLessonAvgScore(vocabIds: string[]): number {
  if (vocabIds.length === 0) return 0;
  const all = getLocalProgress();
  const total = vocabIds.reduce((sum, id) => sum + (all[id]?.score ?? 0), 0);
  return Math.round(total / vocabIds.length);
}

// Lưu phiên ôn tập vào DB
export async function saveStudySession(
  type: "flashcard" | "quiz" | "writing" | "speaking",
  lessonId: string,
  score: number,
  total: number,
  durationSeconds: number
) {
  // Lưu localStorage
  const sessions = JSON.parse(localStorage.getItem("study_sessions") || "[]");
  sessions.push({ type, lessonId, score, total, durationSeconds, created_at: new Date().toISOString() });
  localStorage.setItem("study_sessions", JSON.stringify(sessions.slice(-100))); // Giữ 100 phiên gần nhất

  // Sync Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from("study_sessions").insert({
        user_id: session.user.id,
        session_type: type,
        lesson_id: lessonId,
        score,
        total,
        duration_seconds: durationSeconds,
      });
    }
  } catch { /* Ignore */ }
}

export const MASTERY_THRESHOLD_VALUE = MASTERY_THRESHOLD;

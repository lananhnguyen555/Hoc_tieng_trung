import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { syncProgressFromCloud } from "@/lib/srs";

export interface Word {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  word_type: string;
  lesson_id: string;
  lesson?: string;
}

export interface Lesson {
  id: string;
  name: string;
}

export function useVocabData() {
  const [vocab, setVocab] = useState<Word[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load từ Supabase
        const { data: dbLessons } = await supabase.from("lessons").select("*").order("created_at");
        const { data: dbVocab } = await supabase.from("vocab").select("*, lessons(name, id)").order("created_at", { ascending: true });

        // Load từ localStorage
        const localLessons: Lesson[] = JSON.parse(localStorage.getItem("user_lessons") || "[]");
        const localVocab: Word[] = JSON.parse(localStorage.getItem("user_vocab") || "[]");

        const { data: { session } } = await supabase.auth.getSession();

        let finalLessons: Lesson[] = [...(dbLessons || [])];
        let finalVocab: Word[] = [];

        if (dbVocab) {
          finalVocab = dbVocab.map((item: any) => ({
            ...item,
            word_type: item.word_type || "",
            lesson: item.lessons?.name || "",
            lesson_id: item.lesson_id,
          }));
        }

        if (!session?.user) {
          finalLessons = [...finalLessons, ...localLessons];
          finalVocab = [...finalVocab, ...localVocab];
        }

        setLessons(finalLessons);
        setVocab(finalVocab);

        // Sync SRS progress từ cloud
        await syncProgressFromCloud();
      } catch (err) {
        console.error("useVocabData error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { vocab, lessons, loading };
}

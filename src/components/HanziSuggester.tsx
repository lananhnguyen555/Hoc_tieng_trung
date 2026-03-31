"use client";

import { useState, useEffect } from "react";
import { PINYIN_TO_HANZI } from "@/lib/pinyin-data";
import styles from "./suggester.module.css";

interface Props {
  pinyin: string;
  onSelect: (char: string) => void;
}

export default function HanziSuggester({ pinyin, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!pinyin) {
      setSuggestions([]);
      return;
    }

    // Process pinyin: remove tones and lowercase
    const cleanPinyin = pinyin.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/v/g, "ü");
    
    // Find suggestions for each syllable if it's a multi-syllable word
    // For simplicity, we just look at the last syllable or the whole thing
    const syllables = cleanPinyin.split(/\s+/);
    const lastSyllable = syllables[syllables.length - 1];
    
    const matches = PINYIN_TO_HANZI[lastSyllable] || [];
    setSuggestions(matches);
  }, [pinyin]);

  if (suggestions.length === 0) return null;

  return (
    <div className={styles.container}>
      {suggestions.map((char, index) => (
        <button
          key={`${char}-${index}`}
          className={styles.suggestion}
          onClick={() => onSelect(char)}
          type="button"
        >
          {char}
        </button>
      ))}
    </div>
  );
}

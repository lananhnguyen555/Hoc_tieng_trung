"use client";

import { useState, useEffect } from "react";
import { PINYIN_TO_HANZI } from "@/lib/pinyin-data";
import { WORD_DATA } from "@/lib/word-data";
import styles from "./suggester.module.css";
import { pinyin as getPinyin } from "pinyin-pro";

interface Props {
  pinyin: string;
  onSelect: (char: string, accented: string) => void;
}

export default function HanziSuggester({ pinyin, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!pinyin) {
      setSuggestions([]);
      return;
    }

    // Process pinyin: remove tones and lowercase
    const cleanPinyin = pinyin.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/v/g, "ü")
      .replace(/\s+/g, ""); // Also remove spaces for word lookup
    
    // 1. Try word lookup first (multi-syllable)
    const wordMatches = WORD_DATA[cleanPinyin] || [];
    
    // 2. Try single syllable lookup (last syllable)
    const syllables = pinyin.trim().toLowerCase().split(/\s+/);
    const lastSyllable = syllables[syllables.length - 1];
    const charMatches = PINYIN_TO_HANZI[lastSyllable] || [];
    
    // Combine, prioritizing words
    const uniqueSuggestions = Array.from(new Set([...wordMatches, ...charMatches]));
    setSuggestions(uniqueSuggestions.slice(0, 15));
  }, [pinyin]);

  if (suggestions.length === 0) return null;

  return (
    <div className={styles.container}>
      {suggestions.map((char, index) => (
        <button
          key={`${char}-${index}`}
          className={styles.suggestion}
          onClick={() => {
            // Use pinyin-pro to get the full accented pinyin for the selected string
            const accented = getPinyin(char, { toneType: "symbol" }).replace(/\s+/g, '');
            onSelect(char, accented);
          }}
          type="button"
        >
          {char}
        </button>
      ))}
    </div>
  );
}

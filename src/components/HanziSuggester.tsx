"use client";

import { useState, useEffect } from "react";
import styles from "./suggester.module.css";
import { pinyin as getPinyin } from "pinyin-pro";

interface Props {
  pinyin: string;
  onSelect: (char: string, accented: string) => void;
}

export default function HanziSuggester({ pinyin, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pinyin || pinyin.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchGoogleSuggestions(pinyin);
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [pinyin]);

  const fetchGoogleSuggestions = async (input: string) => {
    setLoading(true);
    try {
      // Clean pinyin: remove tones for API request
      const cleanPinyin = input.trim().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/v/g, "ü");

      const response = await fetch(
        `https://inputtools.google.com/request?text=${encodeURIComponent(cleanPinyin)}&itc=zh-t-i0-pinyin&num=20&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`
      );
      const data = await response.json();

      if (data[0] === "SUCCESS") {
        const rawResults = data[1][0][1];
        setSuggestions(rawResults || []);
      }
    } catch (err) {
      console.error("Gợi ý Google lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  if (suggestions.length === 0 && !loading) return null;

  return (
    <div className={styles.container}>
      {loading && suggestions.length === 0 ? (
        <span style={{fontSize:'0.8rem', padding:'0.5rem'}}>Đang lấy gợi ý từ Google...</span>
      ) : (
        suggestions.map((char, index) => (
          <button
            key={`${char}-${index}`}
            className={styles.suggestion}
            onClick={() => {
              // Get standard accented pinyin from pinyin-pro (no spaces)
              const accented = getPinyin(char, { toneType: "symbol" }).replace(/\s+/g, '');
              onSelect(char, accented);
            }}
            type="button"
          >
            {char}
          </button>
        ))
      )}
    </div>
  );
}

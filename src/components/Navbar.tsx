"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Moon, Sun, BookOpen, GraduationCap, Scale, Home } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <header className={`${styles.header} glass`}>
      <nav className={`${styles.nav} container`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}> Học Tiếng Trung</span>
        </Link>

        <div className={styles.links}>
          <Link href="/" className={styles.link}>
            <Home size={20} /> <span>Trang chủ</span>
          </Link>
          <Link href="/vocab" className={styles.link}>
            <BookOpen size={20} /> <span>Từ vựng</span>
          </Link>
          <Link href="/grammar" className={styles.link}>
            <GraduationCap size={20} /> <span>Ngữ pháp</span>
          </Link>
          <Link href="/rules" className={styles.link}>
            <Scale size={20} /> <span>Quy tắc</span>
          </Link>
        </div>

        <button onClick={toggleTheme} className={styles.themeToggle}>
          {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
        </button>
      </nav>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Moon, Sun, BookOpen, GraduationCap, Scale, Home, LogIn, LogOut, User, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Check Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}> Học Tiếng Trung <span className={styles.betaBadge}>BETA</span></span>
        </Link>

        <div className={styles.links}>
          <Link href="/" className={styles.link}>
            <Home size={20} /> <span>Trang chủ</span>
          </Link>
          <Link href="/vocab" className={styles.link}>
            <BookOpen size={20} /> <span>Từ vựng</span>
          </Link>
          <Link href="/phrases" className={styles.link}>
            <MessageCircle size={20} /> <span>Giao tiếp</span>
          </Link>
          <Link href="/grammar" className={styles.link}>
            <GraduationCap size={20} /> <span>Ngữ pháp</span>
          </Link>
          <Link href="/rules" className={styles.link}>
            <Scale size={20} /> <span>Quy tắc</span>
          </Link>
          <Link href="/study" className={styles.link}>
            <GraduationCap size={20} /> <span>Ôn tập</span>
          </Link>
        </div>

        <div className={styles.rightSection}>
          {user ? (
            <div className={styles.userSection}>
              <span className={styles.userEmail}><User size={16} /> {user.email?.split('@')[0]}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link href="/auth" className={styles.loginLink}>
              <LogIn size={20} /> <span>Đăng nhập</span>
            </Link>
          )}

          <button onClick={toggleTheme} className={styles.themeToggle}>
            {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
          </button>
        </div>

      </nav>
    </header>
  );
}

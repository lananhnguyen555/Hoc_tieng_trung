"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        // Nếu email confirmation bị tắt trong Supabase → đăng nhập luôn
        if (data?.session) {
          router.push("/");
          return;
        }
        setError("Kiểm tra email để xác nhận đăng ký (nếu có).");
      }
      
      if (isLogin) router.push("/");
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`card ${styles.authCard}`}>
        <div className={styles.header}>
          <h1>{isLogin ? "Đăng nhập" : "Đăng ký"}</h1>
          <p>{isLogin ? "Chào mừng bạn quay trở lại!" : "Bắt đầu hành trình học tiếng Trung ngay."}</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleAuth} className={styles.form}>
          <div className={styles.inputGroup}>
            <label><Mail size={16} /> Email</label>
            <input 
              type="email" 
              placeholder="vancol@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label><Lock size={16} /> Mật khẩu</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className={styles.spin} /> : (
              <>
                {isLogin ? "Đăng nhập" : "Tạo tài khoản"} 
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <span>{isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}</span>
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Đăng ký ngay" : "Đăng nhập tại đây"}
          </button>
        </div>
      </div>
    </div>
  );
}

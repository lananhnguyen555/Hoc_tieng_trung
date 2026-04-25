import Link from "next/link";
import { Zap, ChevronRight, BookOpen, GraduationCap, Scale, Volume2, CheckCircle2, FileUp, PenTool, MessageCircle } from "lucide-react";
import styles from "./page.module.css";
import InitialsTable from "@/components/Phonetics/InitialsTable";
import FinalsTable from "@/components/Phonetics/FinalsTable";
import TonesSection from "@/components/Phonetics/TonesSection";
import PinyinCombinationTable from "@/components/Phonetics/PinyinCombinationTable";

export default function Home() {
  return (
    <div className={styles.container}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Zap size={13} className={styles.zapIcon} />
            <span>Nền tảng học Tiếng Trung thông minh</span>
          </div>

          <h1 className={styles.title}>
            Học <span className={styles.accent}>Tiếng Trung</span><br />
            Hiệu quả — Thú vị
          </h1>

          <p className={styles.subtitle}>
            Hệ thống học tập thông minh với SRS, Quiz, Flashcard, luyện phát âm — 
            giúp bạn thành thạo tiếng Trung nhanh hơn bao giờ hết.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/study" className="btn-primary">
              🚀 Bắt đầu ôn tập
            </Link>
            <Link href="/vocab" className={styles.secondaryBtn}>
              📖 Xem từ vựng <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.decoration1} />
          <div className={styles.decoration2} />
          <div className={styles.floatingCard}>
            <span className={styles.chinese}>你好</span>
            <span className={styles.pinyin}>nǐ hǎo</span>
            <span className={styles.meaning}>Xin chào</span>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statNum}>5+</span>
          <span className={styles.statLabel}>Chế độ luyện tập</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum}>SRS</span>
          <span className={styles.statLabel}>Thuật toán nhắc lại</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum}>AI</span>
          <span className={styles.statLabel}>Nhận dạng giọng nói</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum}>100%</span>
          <span className={styles.statLabel}>Miễn phí trọn đời</span>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tất cả chức năng bạn cần</h2>
          <p className={styles.sectionSub}>Từ học từ vựng đến luyện phát âm, mọi thứ trong một nơi.</p>
        </div>
        <div className={styles.grid}>
          <Link href="/vocab" className={styles.featureCard}>
            <div className={`${styles.iconWrapper} ${styles.blue}`}><BookOpen size={24} /></div>
            <h3>Từ vựng</h3>
            <p>Quản lý từ vựng theo buổi học, nhập file Excel, tra cứu nhanh với Ctrl+K.</p>
            <span className={styles.learnMore}>Xem thêm <ChevronRight size={16} /></span>
          </Link>

          <Link href="/grammar" className={styles.featureCard}>
            <div className={`${styles.iconWrapper} ${styles.purple}`}><GraduationCap size={24} /></div>
            <h3>Ngữ pháp</h3>
            <p>Tổng hợp cấu trúc, quy tắc sắp xếp câu từ cơ bản đến nâng cao.</p>
            <span className={styles.learnMore}>Xem thêm <ChevronRight size={16} /></span>
          </Link>

          <Link href="/phrases" className={styles.featureCard}>
            <div className={`${styles.iconWrapper} ${styles.cyan}`}><MessageCircle size={24} /></div>
            <h3>Giao tiếp</h3>
            <p>Bộ câu giao tiếp thực tế theo tình huống, âm thanh phát âm chuẩn.</p>
            <span className={styles.learnMore}>Xem thêm <ChevronRight size={16} /></span>
          </Link>
        </div>
      </section>

      {/* ── STUDY MODES ── */}
      <section className={styles.studyPreview}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>5 chế độ luyện tập</h2>
          <p className={styles.sectionSub}>Mỗi chế độ tập trung vào một kỹ năng khác nhau.</p>
        </div>
        <div className={styles.studyGrid}>
          <Link href="/study/flashcards" className={styles.studyCard}>
            <span style={{fontSize:'2rem'}}>🗃️</span>
            <span>Flashcard SRS</span>
          </Link>
          <Link href="/study/quiz" className={styles.studyCard}>
            <span style={{fontSize:'2rem'}}>📝</span>
            <span>Trắc nghiệm</span>
          </Link>
          <Link href="/study/listening" className={styles.studyCard}>
            <span style={{fontSize:'2rem'}}>🎤</span>
            <span>Nghe & Nói</span>
          </Link>
          <Link href="/study/writing" className={styles.studyCard}>
            <span style={{fontSize:'2rem'}}>✍️</span>
            <span>Kiểm tra viết</span>
          </Link>
        </div>
        <div style={{textAlign:'center', marginTop:'2rem'}}>
          <Link href="/study" className="btn-primary">
            Vào trung tâm ôn tập <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── PHONETICS ── */}
      <section id="phonetics" style={{padding:'0 2rem 4rem'}}>
        <div className={styles.sectionHeader} style={{marginBottom:'2rem'}}>
          <h2 className={styles.sectionTitle}>Bảng phiên âm Pinyin</h2>
          <p className={styles.sectionSub}>Nền tảng phát âm chuẩn cho người mới bắt đầu.</p>
        </div>
        <InitialsTable />
        <FinalsTable />
        <TonesSection />
        <PinyinCombinationTable />
      </section>

    </div>
  );
}

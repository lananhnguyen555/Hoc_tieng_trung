import Link from "next/link";
import { Zap, ChevronRight, BookOpen, GraduationCap, Scale, Volume2, CheckCircle2, FileUp } from "lucide-react";
import styles from "./page.module.css";
import phoneticsStyles from "@/components/Phonetics/phonetics.module.css";
import InitialsTable from "@/components/Phonetics/InitialsTable";
import FinalsTable from "@/components/Phonetics/FinalsTable";
import TonesSection from "@/components/Phonetics/TonesSection";
import PinyinCombinationTable from "@/components/Phonetics/PinyinCombinationTable";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Zap size={14} className={styles.zapIcon} />
            <span>Nền tảng học Tiếng Trung thông minh</span>
          </div>
          <h1 className={styles.title}>
            Làm chủ <span className={styles.accent}>Phát Âm</span> <br /> 
            Chuẩn ngay từ đầu
          </h1>
          <p className={styles.subtitle}>
            Tìm hiểu về Hệ thống Phiên âm Pinyin (Thanh mẫu, Vận mẫu, Thanh điệu) 
            và xây dựng nền tảng vững chắc cho việc học Tiếng Trung.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/vocab" className="btn-primary">
              Bắt đầu học Từ vựng
            </Link>
            <a href="#phonetics" className={styles.secondaryBtn}>
              Học phát âm Pinyin
            </a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingCard}>
            <span className={styles.chinese}>你好</span>
            <span className={styles.pinyin}>nǐhǎo</span>
            <span className={styles.meaning}>Xin chào</span>
          </div>
          <div className={styles.decoration1}></div>
          <div className={styles.decoration2}></div>
        </div>
      </section>

      {/* Phonetics Section */}
      <section id="phonetics" className={phoneticsStyles.container}>
        <InitialsTable />
        <FinalsTable />
        <TonesSection />
        <PinyinCombinationTable />
      </section>

      {/* Features Grid */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Chức năng mở rộng</h2>
        <div className={styles.grid}>
          <Link href="/vocab" className={`card ${styles.featureCard}`}>
            <div className={`${styles.iconWrapper} ${styles.blue}`}>
              <BookOpen size={24} />
            </div>
            <h3>Từ vựng</h3>
            <p>Học theo buổi học, kèm gợi ý Hán tự thông minh và Pinyin tự động.</p>
            <span className={styles.learnMore}>
              Xem thêm <ChevronRight size={16} />
            </span>
          </Link>

          <Link href="/grammar" className={`card ${styles.featureCard}`}>
            <div className={`${styles.iconWrapper} ${styles.purple}`}>
              <GraduationCap size={24} />
            </div>
            <h3>Ngữ pháp</h3>
            <p>Tổng hợp cấu trúc, quy tắc sắp xếp câu từ cơ bản đến nâng cao.</p>
            <span className={styles.learnMore}>
              Xem thêm <ChevronRight size={16} />
            </span>
          </Link>

          <Link href="/rules" className={`card ${styles.featureCard}`}>
            <div className={`${styles.iconWrapper} ${styles.orange}`}>
              <Scale size={24} />
            </div>
            <h3>Quy tắc</h3>
            <p>Mẹo học tập, lộ trình hiệu quả cho người mới bắt đầu.</p>
            <span className={styles.learnMore}>
              Xem thêm <ChevronRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      {/* Study Section */}
      <section className={styles.studyPreview}>
        <h2 className={styles.sectionTitle}>Luyện tập & Ôn tập</h2>
        <div className={styles.studyGrid}>
          <Link href="/study/flashcards" className={`card ${styles.studyCard}`}>
            <Zap size={32} color="#fbbf24" />
            <span>Flashcards</span>
          </Link>
          <Link href="/study/quiz" className={`card ${styles.studyCard}`}>
            <CheckCircle2 size={32} color="#22c55e" />
            <span>Trắc nghiệm</span>
          </Link>
          <Link href="/study/listening" className={`card ${styles.studyCard}`}>
            <Volume2 size={32} color="#0ea5e9" />
            <span>Luyện nghe</span>
          </Link>
          <Link href="/study/import" className={`card ${styles.studyCard}`}>
            <FileUp size={32} color="#a855f7" />
            <span>Nhập liệu</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { BookOpen, GraduationCap, Scale, ChevronRight, Zap, Volume2, CheckCircle2, FileUp } from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Zap size={14} className={styles.zapIcon} />
            <span>Cập nhật mới: Flashcards ôn tập</span>
          </div>
          <h1 className={styles.title}>
            Làm chủ <span className={styles.accent}>Tiếng Trung</span> <br /> 
            từ con số không
          </h1>
          <p className={styles.subtitle}>
            Học từ vựng, ngữ pháp và luyện viết Hán tự với sự hỗ trợ của AI. 
            Xây dựng lộ trình học tập cá nhân hóa ngay hôm nay.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/vocab" className="btn-primary">
              Bắt đầu học ngay
            </Link>
            <Link href="/rules" className={styles.secondaryBtn}>
              Xem quy tắc học
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingCard}>
            <span className={styles.chinese}>学习</span>
            <span className={styles.pinyin}>xuéxí</span>
            <span className={styles.meaning}>Học tập</span>
          </div>
          <div className={styles.decoration1}></div>
          <div className={styles.decoration2}></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Khám phá kho tàng kiến thức</h2>
        <div className={styles.grid}>
          <Link href="/vocab" className={`card ${styles.featureCard}`}>
            <div className={`${styles.iconWrapper} ${styles.blue}`}>
              <BookOpen size={24} />
            </div>
            <h3>Từ vựng</h3>
            <p>Hàng ngàn từ vựng được chia theo buổi học, kèm ví dụ sinh động.</p>
            <span className={styles.learnMore}>
              Xem thêm <ChevronRight size={16} />
            </span>
          </Link>

          <Link href="/grammar" className={`card ${styles.featureCard}`}>
            <div className={`${styles.iconWrapper} ${styles.purple}`}>
              <GraduationCap size={24} />
            </div>
            <h3>Ngữ pháp</h3>
            <p>Các cấu trúc ngữ pháp từ cơ bản đến nâng cao, giải thích chi tiết.</p>
            <span className={styles.learnMore}>
              Xem thêm <ChevronRight size={16} />
            </span>
          </Link>

          <Link href="/rules" className={`card ${styles.featureCard}`}>
            <div className={`${styles.iconWrapper} ${styles.orange}`}>
              <Scale size={24} />
            </div>
            <h3>Quy tắc học</h3>
            <p>Mẹo và quy chuẩn giúp bạn ghi nhớ và áp dụng tiếng Trung hiệu quả.</p>
            <span className={styles.learnMore}>
              Xem thêm <ChevronRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      {/* Study Section */}
      <section className={styles.studyPreview}>
        <h2 className={styles.sectionTitle}>Sẵn sàng ôn tập?</h2>
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
            <span>Cá nhân hóa</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

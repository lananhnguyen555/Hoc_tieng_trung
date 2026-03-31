import VocabList from "./VocabList";
import styles from "./vocab.module.css";

export default function VocabPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kho từ vựng</h1>
        <p className={styles.subtitle}>Tìm kiếm và học từ vựng theo chủ đề và cấp độ.</p>
      </header>
      
      <VocabList />
    </div>
  );
}

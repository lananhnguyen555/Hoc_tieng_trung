import styles from "./rules.module.css";
import { Info, AlertCircle, CheckCircle } from "lucide-react";

const MOCK_RULES = [
  {
    id: 1,
    title: "Quy tắc 8 nét cơ bản",
    content: "Tiếng Trung được cấu thành từ 8 nét cơ bản: Chấm, Ngang, Sổ, Phẩy, Mác, Hất, Gập, Móc.",
    type: "info",
  },
  {
    id: 2,
    title: "Quy tắc viết Chữ Hán",
    content: "Từ trái sang phải, từ trên xuống dưới, ngang trước sổ sau, phẩy trước mác sau...",
    type: "important",
  },
  {
    id: 3,
    title: "Lộ trình học hiệu quả",
    content: "Học theo giáo trình HSK, kết hợp nghe nói đọc viết hàng ngày ít nhất 30 phút.",
    type: "success",
  },
];

export default function RulesPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Quy tắc học tập</h1>
        <p className={styles.subtitle}>Những lưu ý và quy chuẩn quan trọng khi bắt đầu học tiếng Trung.</p>
      </header>

      <div className={styles.list}>
        {MOCK_RULES.map((rule) => (
          <div key={rule.id} className={`card ${styles.ruleCard} ${styles[rule.type]}`}>
            <div className={styles.icon}>
              {rule.type === "info" && <Info size={24} />}
              {rule.type === "important" && <AlertCircle size={24} />}
              {rule.type === "success" && <CheckCircle size={24} />}
            </div>
            <div className={styles.content}>
              <h3>{rule.title}</h3>
              <p>{rule.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

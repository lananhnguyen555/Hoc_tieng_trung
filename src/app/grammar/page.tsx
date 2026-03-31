import styles from "./grammar.module.css";

const MOCK_GRAMMAR = [
  {
    id: 1,
    title: "Cấu trúc 'đang' (正在 - Zhèngzài)",
    content: "Dùng để diễn tả một hành động đang diễn ra tại một thời điểm nhất định.",
    example: "我正在学习汉语。 (Wǒ zhèngzài xuéxí Hànyǔ.) - Tôi đang học tiếng Hán.",
  },
  {
    id: 2,
    title: "Cấu trúc 'là' (是 - Shì)",
    content: "Dùng để nối danh từ/đại từ với danh từ/đại từ khác để chỉ sự đồng nhất.",
    example: "我是学生。 (Wǒ shì xuésheng.) - Tôi là học sinh.",
  },
  {
    id: 3,
    title: "Câu hỏi với 'không' (吗 - Ma)",
    content: "Thêm '吗' vào cuối câu trần thuật để biến nó thành câu hỏi Có/Không.",
    example: "你是老师吗？ (Nǐ shì lǎoshī ma?) - Bạn là giáo viên phải không?",
  },
];

export default function GrammarPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ngữ pháp tiếng Trung</h1>
        <p className={styles.subtitle}>Tổng hợp các cấu trúc quan trọng từ cơ bản đến nâng cao.</p>
      </header>

      <div className={styles.grid}>
        {MOCK_GRAMMAR.map((item) => (
          <div key={item.id} className={`card ${styles.grammarCard}`}>
            <h2>{item.title}</h2>
            <p className={styles.content}>{item.content}</p>
            <div className={styles.exampleBox}>
              <strong>Ví dụ:</strong>
              <p>{item.example}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

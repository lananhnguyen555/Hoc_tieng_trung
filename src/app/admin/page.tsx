import { Plus, Trash2, Edit2, Save, X, FileUp, Download } from "lucide-react";
import styles from "./admin.module.css";
import HanziSuggester from "@/components/HanziSuggester";

export default function AdminPage() {
  const [vocab, setVocab] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [newWord, setNewWord] = useState({ word: "", pinyin: "", meaning: "", lesson_id: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: vocabData } = await supabase.from("vocab").select("*, lessons(name)");
    const { data: lessonData } = await supabase.from("lessons").select("*");
    
    if (vocabData) setVocab(vocabData);
    if (lessonData) setLessons(lessonData);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("vocab").insert([newWord]);
    if (!error) {
      setNewWord({ word: "", pinyin: "", meaning: "", lesson_id: "" });
      fetchData();
    } else {
      alert("Lỗi khi thêm từ: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Xóa từ này?")) {
      await supabase.from("vocab").delete().eq("id", id);
      fetchData();
    }
  };

  // Bulk Import Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newWord.lesson_id) {
      alert("Vui lòng chọn Buổi học trước khi import file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const dataToInsert = [];

      // Skip header and process lines
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [word, pinyin, meaning] = line.split(",").map(s => s.trim());
        if (word && pinyin && meaning) {
          dataToInsert.push({
            word,
            pinyin,
            meaning,
            lesson_id: newWord.lesson_id
          });
        }
      }

      if (dataToInsert.length > 0) {
        setLoading(true);
        const { error } = await supabase.from("vocab").insert(dataToInsert);
        if (error) {
          alert("Lỗi khi import: " + error.message);
        } else {
          alert(`Đã import thành công ${dataToInsert.length} từ!`);
          fetchData();
        }
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "hanzi,pinyin,meaning\n学习,xuéxí,Học tập\n老师,lǎoshī,Giáo viên";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vocab_template.csv");
    link.click();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Quản lý nội dung (Admin)</h1>
        <p>Thêm từng từ hoặc nhập từ file CSV (Excel).</p>
      </header>

      <div className={styles.adminGrid}>
        {/* Single Add Section */}
        <section className={styles.addSection}>
          <div className={`card ${styles.formCard}`}>
            <h2>Thêm từ vựng mới</h2>
            <form onSubmit={handleAdd} className={styles.form}>
              <input 
                type="text" 
                placeholder="Pinyin (ví dụ: xuéxí)" 
                value={newWord.pinyin}
                onChange={(e) => setNewWord({...newWord, pinyin: e.target.value})}
                required
              />
              <input 
                type="text" 
                placeholder="Hán tự (ví dụ: 学习)" 
                value={newWord.word}
                onChange={(e) => setNewWord({...newWord, word: e.target.value})}
                required
              />
              <HanziSuggester 
                pinyin={newWord.pinyin} 
                onSelect={(char) => setNewWord({...newWord, word: newWord.word + char})} 
              />
              <input 
                type="text" 
                placeholder="Nghĩa (ví dụ: Học tập)" 
                value={newWord.meaning}
                onChange={(e) => setNewWord({...newWord, meaning: e.target.value})}
                required
              />
              <select 
                value={newWord.lesson_id} 
                onChange={(e) => setNewWord({...newWord, lesson_id: e.target.value})}
                required
              >
                <option value="">Chọn buổi học</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <button type="submit" className="btn-primary">
                <Plus size={20} /> Thêm vào kho
              </button>
            </form>
          </div>
        </section>

        {/* Bulk Import Section */}
        <section className={styles.importSection}>
          <div className={`card ${styles.formCard}`}>
            <h2>Nhập từ file (Bulk Import)</h2>
            <p className={styles.importHint}>Tải file template CSV và điền dữ liệu của bạn.</p>
            <div className={styles.importCtas}>
              <button className={styles.outlineBtn} onClick={downloadTemplate}>
                <Download size={18} /> Tải file mẫu
              </button>
              <button className={styles.importBtn} onClick={() => fileInputRef.current?.click()}>
                <FileUp size={18} /> Chọn file CSV
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className={styles.hidden} 
                accept=".csv"
              />
            </div>
            <p className={styles.warning}>* Hãy chọn Buổi học ở form bên trái trước khi import.</p>
          </div>
        </section>
      </div>

      <section className={styles.listSection}>
        <h2>Danh sách từ vựng ({vocab.length})</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hán tự</th>
                <th>Pinyin</th>
                <th>Nghĩa</th>
                <th>Buổi</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>Đang tải...</td></tr>
              ) : vocab.length === 0 ? (
                <tr><td colSpan={5}>Chưa có dữ liệu (Hãy kết nối Supabase)</td></tr>
              ) : (
                vocab.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.wordTd}>{item.word}</td>
                    <td>{item.pinyin}</td>
                    <td>{item.meaning}</td>
                    <td>{item.lessons?.name || "N/A"}</td>
                    <td className={styles.actions}>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

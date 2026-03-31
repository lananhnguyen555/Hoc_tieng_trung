"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, RotateCcw, ChevronRight, Trophy } from "lucide-react";
import styles from "./quiz.module.css";

const MOCK_QUESTIONS = [
  {
    id: 1,
    word: "学习",
    options: ["Học tập", "Giáo viên", "Học sinh", "Cảm ơn"],
    correct: "Học tập",
  },
  {
    id: 2,
    word: "lǎoshī",
    options: ["Học tập", "Giáo viên", "Học sinh", "Cảm ơn"],
    correct: "Giáo viên",
  },
  {
    id: 3,
    word: "学生",
    options: ["Học tập", "Giáo viên", "Học sinh", "Cảm ơn"],
    correct: "Học sinh",
  },
];

export default function QuizPage() {
  const [allVocab, setAllVocab] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [questions, setQuestions] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    // Load data
    const localVocab = JSON.parse(localStorage.getItem("user_vocab") || "[]");
    const localLessons = JSON.parse(localStorage.getItem("user_lessons") || "[]");
    const combinedVocab = [...MOCK_QUESTIONS.map(q => ({id: q.id, word: q.word, pinyin: "", meaning: q.correct, lesson_id: "mock"})), ...localVocab];
    
    setAllVocab(combinedVocab);
    setLessons([{id: "mock", name: "Dữ liệu mẫu"}, ...localLessons]);
  }, []);

  useEffect(() => {
    generateQuestions();
  }, [allVocab, selectedLessonId]);

  const generateQuestions = () => {
    const filtered = allVocab.filter(v => selectedLessonId === "all" || v.lesson_id === selectedLessonId);
    if (filtered.length === 0) {
      setQuestions([]);
      return;
    }

    const newQuestions = filtered.map(item => {
      // Get 3 random wrong answers from the rest of the vocab
      const otherMeanings = allVocab
        .filter(v => v.id !== item.id)
        .map(v => v.meaning);
      
      const shuffledOptions = [item.meaning];
      while (shuffledOptions.length < Math.min(4, allVocab.length)) {
        const randomMeaning = otherMeanings[Math.floor(Math.random() * otherMeanings.length)];
        if (!shuffledOptions.includes(randomMeaning)) {
          shuffledOptions.push(randomMeaning);
        }
      }

      return {
        id: item.id,
        word: item.word,
        pinyin: item.pinyin,
        options: shuffledOptions.sort(() => Math.random() - 0.5),
        correct: item.meaning
      };
    }).sort(() => Math.random() - 0.5).slice(0, 10); // Max 10 questions

    setQuestions(newQuestions);
    setStep(0);
    setScore(0);
    setFinished(false);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const currentQuestion = questions[step];

  const handleOptionClick = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === currentQuestion.correct;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);
  };

  const nextQuestion = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setStep(0);
    setScore(0);
    setFinished(false);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  if (questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Trắc nghiệm từ vựng</h1>
          <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.lessonSelect}>
            <option value="all">Tất cả bài học</option>
            {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className={styles.empty}>Chưa có từ vựng trong buổi này để tạo câu hỏi!</div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className={styles.container}>
        <div className={`card ${styles.resultCard}`}>
          <Trophy size={64} className={styles.trophy} />
          <h1>Kết quả luyện tập</h1>
          <p className={styles.scoreText}>Bạn đã trả lời đúng <strong>{score}/{questions.length}</strong> câu hỏi.</p>
          <button className="btn-primary" onClick={generateQuestions}>
            <RotateCcw size={20} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Trắc nghiệm từ vựng</h1>
        <select value={selectedLessonId} onChange={e => setSelectedLessonId(e.target.value)} className={styles.lessonSelect}>
          <option value="all">Tất cả bài học</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </header>

      <div className={styles.quizArea}>
        <div className={`card ${styles.questionCard}`}>
          <span className={styles.questionHint}>Nghĩa của từ này là gì?</span>
          <h2 className={styles.word}>{currentQuestion.word}</h2>
          {currentQuestion.pinyin && <p className={styles.pinyin}>{currentQuestion.pinyin}</p>}
        </div>

        <div className={styles.optionsGrid}>
          {currentQuestion.options.map((option: string) => (
            <button
              key={option}
              className={`card ${styles.optionBtn} ${
                selectedOption === option
                  ? option === currentQuestion.correct
                    ? styles.correct
                    : styles.wrong
                  : selectedOption && option === currentQuestion.correct
                  ? styles.correctIndicator
                  : ""
              }`}
              onClick={() => handleOptionClick(option)}
              disabled={!!selectedOption}
            >
              {option}
              {selectedOption === option && (
                <div className={styles.feedbackIcon}>
                  {option === currentQuestion.correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
              )}
            </button>
          ))}
        </div>

        {selectedOption && (
          <button className={`btn-primary ${styles.nextBtn}`} onClick={nextQuestion}>
            {step < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"} <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import WordDetailModal from "./components/WordDetailModal.jsx";
import { wordBooks } from "./data/words.js";
import Home from "./pages/Home.jsx";
import BookSelect from "./pages/BookSelect.jsx";
import WordOverview from "./pages/WordOverview.jsx";
import StudySettings from "./pages/StudySettings.jsx";
import Study from "./pages/Study.jsx";
import Summary from "./pages/Summary.jsx";
import Mistakes from "./pages/Mistakes.jsx";
import Statistics from "./pages/Statistics.jsx";
import { clearMistakeProgress, loadState, resetBookProgress, saveState } from "./utils/storage.js";
import { selectWordsForSession } from "./utils/quiz.js";

const modeLabels = {
  unlearned: "学习未学会单词",
  wrong: "复习答错单词",
  all: "随机练习全部单词",
  learned: "重新学习已学会单词",
};

export default function App() {
  const initialState = useMemo(() => loadState(wordBooks), []);
  const [books, setBooks] = useState(initialState.books);
  const [records, setRecords] = useState(initialState.records);
  const [theme, setTheme] = useState(initialState.theme);
  const [view, setView] = useState("home");
  const [selectedBookId, setSelectedBookId] = useState(initialState.records.currentBookId || "cet4");
  const [initialMode, setInitialMode] = useState("unlearned");
  const [sessionWords, setSessionWords] = useState([]);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [detailWord, setDetailWord] = useState(null);

  const selectedBook = books.find((book) => book.id === selectedBookId) || books[0];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveState({ books, records, theme });
  }, [books, records, theme]);

  const navigate = (nextView) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateWord = (wordId, updater) => {
    setBooks((currentBooks) =>
      currentBooks.map((book) => ({
        ...book,
        words: book.words.map((word) => (word.id === wordId ? updater(word) : word)),
      })),
    );
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const openOverview = (bookId) => {
    setSelectedBookId(bookId);
    setRecords((current) => ({ ...current, currentBookId: bookId }));
    navigate("overview");
  };

  const openSettings = (bookId, mode = "unlearned") => {
    setSelectedBookId(bookId);
    setInitialMode(mode);
    setRecords((current) => ({ ...current, currentBookId: bookId }));
    navigate("settings");
  };

  const startSession = (config) => {
    const book = books.find((item) => item.id === selectedBookId);
    const words = selectWordsForSession(book, config);
    setSessionWords(words);
    setSessionMeta({
      ...config,
      bookId: book.id,
      bookName: book.name,
      answered: 0,
      correct: 0,
      wrong: 0,
      newLearned: 0,
      startedAt: new Date().toISOString(),
    });
    setSummary(null);
    navigate("study");
  };

  const answerWord = (word, option) => {
    const correct = option.isCorrect;
    const now = new Date().toISOString();
    let becameLearned = false;

    updateWord(word.id, (currentWord) => {
      becameLearned = correct && !currentWord.learned;
      return {
        ...currentWord,
        learned: correct ? true : false,
        wrongCount: correct ? currentWord.wrongCount : currentWord.wrongCount + 1,
        lastStudiedAt: now,
      };
    });

    setSessionMeta((current) => ({
      ...current,
      answered: current.answered + 1,
      correct: current.correct + (correct ? 1 : 0),
      wrong: current.wrong + (correct ? 0 : 1),
      newLearned: current.newLearned + (becameLearned ? 1 : 0),
    }));

    setRecords((current) => ({
      ...current,
      totalAnswered: current.totalAnswered + 1,
      totalCorrect: current.totalCorrect + (correct ? 1 : 0),
      totalWrong: current.totalWrong + (correct ? 0 : 1),
    }));

    return { correct, becameLearned };
  };

  const finishSession = () => {
    const finishedAt = new Date().toISOString();
    const finalSummary = {
      id: `session-${Date.now()}`,
      bookId: sessionMeta.bookId,
      bookName: sessionMeta.bookName,
      mode: sessionMeta.mode,
      modeLabel: modeLabels[sessionMeta.mode],
      total: sessionMeta.answered,
      correct: sessionMeta.correct,
      wrong: sessionMeta.wrong,
      newLearned: sessionMeta.newLearned,
      date: finishedAt,
    };

    setSummary(finalSummary);
    setRecords((current) => ({
      ...current,
      sessions: [...current.sessions, finalSummary],
    }));
    navigate("summary");
  };

  const toggleFavorite = (wordId) => {
    updateWord(wordId, (word) => ({ ...word, favorite: !word.favorite }));
    setDetailWord((word) => (word?.id === wordId ? { ...word, favorite: !word.favorite } : word));
  };

  const markLearned = (wordId) => {
    updateWord(wordId, (word) => ({ ...word, learned: true, lastStudiedAt: new Date().toISOString() }));
  };

  const openMistakeReview = () => {
    const firstBookWithMistakes = books.find((book) => book.words.some((word) => word.wrongCount > 0));
    if (!firstBookWithMistakes) return;
    openSettings(firstBookWithMistakes.id, "wrong");
  };

  const selectedDetailWord =
    detailWord && books.flatMap((book) => book.words).find((word) => word.id === detailWord.id)
      ? books.flatMap((book) => book.words).find((word) => word.id === detailWord.id)
      : detailWord;

  const renderView = () => {
    if (view === "books") {
      return <BookSelect books={books} onOverview={openOverview} onStudy={openSettings} />;
    }

    if (view === "overview") {
      return (
        <WordOverview
          book={selectedBook}
          onStartMode={openSettings}
          onReset={(bookId) => setBooks((current) => resetBookProgress(current, bookId))}
          onDetail={setDetailWord}
          onToggleFavorite={toggleFavorite}
          onSpeak={speak}
        />
      );
    }

    if (view === "settings") {
      return <StudySettings book={selectedBook} initialMode={initialMode} onStart={startSession} onBack={() => navigate("overview")} />;
    }

    if (view === "study") {
      return (
        <Study
          book={selectedBook}
          sessionWords={sessionWords}
          onAnswer={answerWord}
          onFinish={finishSession}
          onSpeak={speak}
          onToggleFavorite={toggleFavorite}
        />
      );
    }

    if (view === "summary" && summary) {
      return (
        <Summary
          book={selectedBook}
          summary={summary}
          onContinue={() => openSettings(selectedBook.id, "unlearned")}
          onWrong={() => openSettings(selectedBook.id, "wrong")}
          onOverview={() => navigate("overview")}
          onBooks={() => navigate("books")}
        />
      );
    }

    if (view === "mistakes") {
      return (
        <Mistakes
          books={books}
          onReview={openMistakeReview}
          onClear={() => setBooks((current) => clearMistakeProgress(current))}
          onMarkLearned={markLearned}
          onDetail={setDetailWord}
        />
      );
    }

    if (view === "statistics") {
      return <Statistics books={books} records={records} />;
    }

    return (
      <Home
        onStart={() => navigate("books")}
        onDocs={() =>
          window.alert(
            "WordVision 是一个本地运行的 AI 视觉词汇学习助手，支持词库选择、词汇总览、四选一学习、错题本、学习统计、localStorage 持久化、深色模式和浏览器发音。完整说明见项目根目录 README.md。",
          )
        }
      />
    );
  };

  return (
    <div className="page-shell">
      <Navbar
        currentView={view}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />
      {renderView()}
      <WordDetailModal
        word={selectedDetailWord}
        onClose={() => setDetailWord(null)}
        onToggleFavorite={toggleFavorite}
        onSpeak={speak}
      />
    </div>
  );
}

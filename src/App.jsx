import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import WordDetailModal from "./components/WordDetailModal.jsx";
import Home from "./pages/Home.jsx";
import BookSelect from "./pages/BookSelect.jsx";
import WordOverview from "./pages/WordOverview.jsx";
import StudySettings from "./pages/StudySettings.jsx";
import Study from "./pages/Study.jsx";
import Summary from "./pages/Summary.jsx";
import Mistakes from "./pages/Mistakes.jsx";
import Statistics from "./pages/Statistics.jsx";
import { bookMeta } from "./data/bookMeta.js";
import {
  clearMistakeProgress,
  createInitialRecords,
  loadState,
  mergeBooksWithProgress,
  resetBookProgress,
  saveState,
  booksToProgressItems,
} from "./utils/storage.js";
import { loadProgress, saveBookProgress } from "./utils/db.js";
import { isDue, selectWordsForSession, updateReviewSchedule } from "./utils/quiz.js";

const bookLoaders = {
  gaokao: () => import("./data/books/gaokao.js").then((module) => module.book),
  cet4: () => import("./data/books/cet4.js").then((module) => module.book),
  cet6: () => import("./data/books/cet6.js").then((module) => module.book),
};

const modeLabels = {
  due: "今日应复习",
  unlearned: "学习未学会单词",
  wrong: "复习答错单词",
  favorite: "收藏重点",
  all: "随机练习全部单词",
  learned: "重新学习已学会单词",
};

const summarizeProgress = (progress, bookId, totalCount) => {
  const items = Object.values(progress || {}).filter((item) => item.bookId === bookId);
  const learned = items.filter((item) => item.learned).length;
  const wrong = items.filter((item) => Number(item.wrongCount) > 0).length;
  const due = items.filter((item) => isDue(item)).length;
  const favorite = items.filter((item) => item.favorite).length;
  return {
    total: totalCount,
    learned,
    unlearned: Math.max(totalCount - learned, 0),
    wrong,
    due,
    favorite,
    progress: totalCount ? Math.round((learned / totalCount) * 100) : 0,
  };
};

const createBookShells = (progress = {}) =>
  bookMeta.map((book) => ({
    ...book,
    words: [],
    loaded: false,
    progressStats: summarizeProgress(progress, book.id, book.totalCount),
  }));

export default function App() {
  const [books, setBooks] = useState([]);
  const [records, setRecords] = useState(createInitialRecords());
  const [theme, setTheme] = useState("light");
  const [view, setView] = useState("home");
  const [selectedBookId, setSelectedBookId] = useState("cet4");
  const [initialMode, setInitialMode] = useState("unlearned");
  const [sessionWords, setSessionWords] = useState([]);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [detailWord, setDetailWord] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [savedProgress, setSavedProgress] = useState({});
  const [loadingBookId, setLoadingBookId] = useState("");

  const selectedBook = books.find((book) => book.id === selectedBookId) || books[0];

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(async () => {
        if (!active) return;
        const initialState = loadState(createBookShells());
        setRecords(initialState.records);
        setTheme(initialState.theme);
        setSelectedBookId(initialState.records.currentBookId || "cet4");
        const progress = await loadProgress();
        if (!active) return;
        setSavedProgress(progress);
        setBooks(createBookShells(progress));
        setHydrated(true);
        setDataReady(true);
      })
      .catch((error) => {
        console.warn("Failed to load WordVision data:", error);
        setHydrated(true);
        setDataReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (!dataReady) return;
    saveState({ records, theme });
    if (hydrated) {
      books
        .filter((book) => book.words?.length)
        .forEach((book) => {
          const progressItems = booksToProgressItems([book]);
          saveBookProgress(
            book.id,
            book.words.map((word) => word.id),
            progressItems,
          ).catch((error) => console.warn("Failed to save IndexedDB progress:", error));
        });
    }
  }, [books, dataReady, hydrated, records, theme]);

  const navigate = async (nextView) => {
    if (nextView === "mistakes") await ensureBooksLoaded();
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateWord = (wordId, updater) => {
    const targetBookId = bookMeta.find((book) => wordId.startsWith(`${book.id}-`))?.id;
    setBooks((currentBooks) =>
      currentBooks.map((book) =>
        targetBookId && book.id !== targetBookId
          ? book
          : {
              ...book,
              words: book.words.map((word) => (word.id === wordId ? updater(word) : word)),
            },
      ),
    );
    setSessionWords((currentWords) => currentWords.map((word) => (word.id === wordId ? updater(word) : word)));
  };

  const ensureBookLoaded = async (bookId) => {
    const current = books.find((book) => book.id === bookId);
    if (current?.words?.length) return current;

    const loader = bookLoaders[bookId];
    if (!loader) throw new Error(`Unknown book: ${bookId}`);
    setLoadingBookId(bookId);
    const rawBook = await loader();
    const mergedBook = {
      ...mergeBooksWithProgress([rawBook], savedProgress)[0],
      loaded: true,
      totalCount: rawBook.words.length,
    };
    setBooks((currentBooks) => currentBooks.map((book) => (book.id === bookId ? mergedBook : book)));
    setLoadingBookId("");
    return mergedBook;
  };

  const ensureBooksLoaded = async () => {
    const missingBooks = books.filter((book) => !book.words?.length);
    if (!missingBooks.length) return books;

    setLoadingBookId("all");
    const loadedBooks = await Promise.all(
      missingBooks.map(async (book) => {
        const rawBook = await bookLoaders[book.id]();
        return {
          ...mergeBooksWithProgress([rawBook], savedProgress)[0],
          loaded: true,
          totalCount: rawBook.words.length,
        };
      }),
    );
    const loadedById = new Map(loadedBooks.map((book) => [book.id, book]));
    const nextBooks = books.map((book) => loadedById.get(book.id) || book);
    setBooks(nextBooks);
    setLoadingBookId("");
    return nextBooks;
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const openOverview = async (bookId) => {
    setSelectedBookId(bookId);
    setRecords((current) => ({ ...current, currentBookId: bookId }));
    await ensureBookLoaded(bookId);
    navigate("overview");
  };

  const openSettings = async (bookId, mode = "unlearned") => {
    setSelectedBookId(bookId);
    setInitialMode(mode);
    setRecords((current) => ({ ...current, currentBookId: bookId }));
    await ensureBookLoaded(bookId);
    navigate("settings");
  };

  const startSession = async (config) => {
    const book = await ensureBookLoaded(selectedBookId);
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
    const becameLearned = correct && !word.learned;

    updateWord(word.id, (currentWord) => {
      const reviewSchedule = updateReviewSchedule(currentWord, correct, now);
      return {
        ...currentWord,
        learned: correct ? true : false,
        wrongCount: correct ? currentWord.wrongCount : currentWord.wrongCount + 1,
        lastStudiedAt: now,
        ...reviewSchedule,
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
    updateWord(wordId, (word) => ({
      ...word,
      learned: true,
      lastStudiedAt: new Date().toISOString(),
      ...updateReviewSchedule(word, true),
    }));
  };

  const updateWordImage = (wordId, imageState) => {
    updateWord(wordId, (word) => ({ ...word, ...imageState }));
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
    if (!dataReady || !books.length) {
      return (
        <main className="mx-auto max-w-3xl px-4 py-16">
          <div className="panel p-8 text-center">
            <h1 className="text-2xl font-black">正在加载完整词库</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">首次加载会读取高考、四级和六级完整词库。</p>
          </div>
        </main>
      );
    }

    if (loadingBookId) {
      const loadingBook = books.find((book) => book.id === loadingBookId);
      return (
        <main className="mx-auto max-w-3xl px-4 py-16">
          <div className="panel p-8 text-center">
            <h1 className="text-2xl font-black">正在加载{loadingBookId === "all" ? "全部词库" : loadingBook?.name || "词库"}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">已按词库拆分加载，稍后进入学习页面。</p>
          </div>
        </main>
      );
    }

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
          onImageUpdate={updateWordImage}
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

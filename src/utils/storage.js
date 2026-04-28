const STORAGE_KEY = "wordvision:v1";

export const createInitialRecords = () => ({
  currentBookId: "cet4",
  totalAnswered: 0,
  totalCorrect: 0,
  totalWrong: 0,
  sessions: [],
});

const mergeBooksWithSavedProgress = (defaultBooks, savedBooks = []) => {
  const savedByWordId = new Map();
  savedBooks.forEach((book) => {
    book.words?.forEach((word) => savedByWordId.set(word.id, word));
  });

  return defaultBooks.map((book) => ({
    ...book,
    words: book.words.map((word) => {
      const saved = savedByWordId.get(word.id);
      if (!saved) return word;
      return {
        ...word,
        learned: Boolean(saved.learned),
        wrongCount: Number(saved.wrongCount) || 0,
        favorite: Boolean(saved.favorite),
        lastStudiedAt: saved.lastStudiedAt || null,
      };
    }),
  }));
};

export const loadState = (defaultBooks) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { books: defaultBooks, records: createInitialRecords(), theme: "light" };
    }

    const saved = JSON.parse(raw);
    return {
      books: mergeBooksWithSavedProgress(defaultBooks, saved.books),
      records: { ...createInitialRecords(), ...(saved.records || {}) },
      theme: saved.theme === "dark" ? "dark" : "light",
    };
  } catch (error) {
    console.warn("Failed to load WordVision state:", error);
    return { books: defaultBooks, records: createInitialRecords(), theme: "light" };
  }
};

export const saveState = (state) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      books: state.books,
      records: state.records,
      theme: state.theme,
    }),
  );
};

export const resetBookProgress = (books, bookId) =>
  books.map((book) =>
    book.id === bookId
      ? {
          ...book,
          words: book.words.map((word) => ({
            ...word,
            learned: false,
            wrongCount: 0,
            favorite: false,
            lastStudiedAt: null,
          })),
        }
      : book,
  );

export const clearMistakeProgress = (books) =>
  books.map((book) => ({
    ...book,
    words: book.words.map((word) => ({ ...word, wrongCount: 0 })),
  }));

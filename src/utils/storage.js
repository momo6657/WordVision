const LEGACY_STORAGE_KEY = "wordvision:v1";
const META_STORAGE_KEY = "wordvision:v2:meta";

const progressFields = [
  "learned",
  "wrongCount",
  "favorite",
  "lastStudiedAt",
  "dueAt",
  "ease",
  "intervalDays",
  "reviewCount",
  "imageUrl",
  "imageStatus",
  "imageProvider",
  "imageModel",
  "imageGeneratedAt",
  "imageError",
];

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

export const mergeBooksWithProgress = (defaultBooks, savedProgress = {}) =>
  defaultBooks.map((book) => ({
    ...book,
    words: book.words.map((word) => {
      const saved = savedProgress[word.id];
      if (!saved) return word;
      return {
        ...word,
        learned: Boolean(saved.learned),
        wrongCount: Number(saved.wrongCount) || 0,
        favorite: Boolean(saved.favorite),
        lastStudiedAt: saved.lastStudiedAt || null,
        dueAt: saved.dueAt || null,
        ease: Number(saved.ease) || word.ease || 2.5,
        intervalDays: Number(saved.intervalDays) || 0,
        reviewCount: Number(saved.reviewCount) || 0,
        imageUrl: saved.imageUrl || word.imageUrl || "",
        imageStatus: saved.imageStatus || word.imageStatus || "idle",
        imageProvider: saved.imageProvider || "",
        imageModel: saved.imageModel || "",
        imageGeneratedAt: saved.imageGeneratedAt || null,
        imageError: saved.imageError || "",
      };
    }),
  }));

export const booksToProgressItems = (books) =>
  books.flatMap((book) =>
    book.words
      .filter((word) =>
        progressFields.some((field) => {
          if (field === "learned" || field === "favorite") return Boolean(word[field]);
          if (field === "wrongCount" || field === "intervalDays" || field === "reviewCount") return Number(word[field]) > 0;
          if (field === "ease") return Number(word[field]) && Number(word[field]) !== 2.5;
          return Boolean(word[field]);
        }),
      )
      .map((word) => ({
        wordId: word.id,
        bookId: book.id,
        learned: Boolean(word.learned),
        wrongCount: Number(word.wrongCount) || 0,
        favorite: Boolean(word.favorite),
        lastStudiedAt: word.lastStudiedAt || null,
        dueAt: word.dueAt || null,
        ease: Number(word.ease) || 2.5,
        intervalDays: Number(word.intervalDays) || 0,
        reviewCount: Number(word.reviewCount) || 0,
        imageUrl: word.imageUrl || "",
        imageStatus: word.imageStatus || "idle",
        imageProvider: word.imageProvider || "",
        imageModel: word.imageModel || "",
        imageGeneratedAt: word.imageGeneratedAt || null,
        imageError: word.imageError || "",
      })),
  );

export const loadState = (defaultBooks) => {
  try {
    const rawMeta = localStorage.getItem(META_STORAGE_KEY);
    if (rawMeta) {
      const saved = JSON.parse(rawMeta);
      return {
        books: defaultBooks,
        records: { ...createInitialRecords(), ...(saved.records || {}) },
        theme: saved.theme === "dark" ? "dark" : "light",
        legacyProgress: null,
      };
    }

    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!rawLegacy) {
      return { books: defaultBooks, records: createInitialRecords(), theme: "light" };
    }

    const saved = JSON.parse(rawLegacy);
    return {
      books: mergeBooksWithSavedProgress(defaultBooks, saved.books),
      records: { ...createInitialRecords(), ...(saved.records || {}) },
      theme: saved.theme === "dark" ? "dark" : "light",
      legacyProgress: mergeBooksWithSavedProgress(defaultBooks, saved.books),
    };
  } catch (error) {
    console.warn("Failed to load WordVision state:", error);
    return { books: defaultBooks, records: createInitialRecords(), theme: "light" };
  }
};

export const saveState = (state) => {
  localStorage.setItem(
    META_STORAGE_KEY,
    JSON.stringify({
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
            dueAt: null,
            ease: 2.5,
            intervalDays: 0,
            reviewCount: 0,
            imageUrl: "",
            imageStatus: "idle",
            imageProvider: "",
            imageModel: "",
            imageGeneratedAt: null,
            imageError: "",
          })),
        }
      : book,
  );

export const clearMistakeProgress = (books) =>
  books.map((book) => ({
    ...book,
    words: book.words.map((word) => ({ ...word, wrongCount: 0 })),
  }));

export const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const getBookStats = (book) => {
  const total = book.words.length;
  const learned = book.words.filter((word) => word.learned).length;
  const wrong = book.words.filter((word) => word.wrongCount > 0).length;
  const due = book.words.filter((word) => isDue(word)).length;
  const favorite = book.words.filter((word) => word.favorite).length;
  return {
    total,
    learned,
    unlearned: total - learned,
    wrong,
    due,
    favorite,
    progress: total ? Math.round((learned / total) * 100) : 0,
  };
};

export const getAllStats = (books, records) => {
  const totalWords = books.reduce((sum, book) => sum + book.words.length, 0);
  const learned = books.reduce((sum, book) => sum + book.words.filter((word) => word.learned).length, 0);
  const wrongWords = books.reduce((sum, book) => sum + book.words.filter((word) => word.wrongCount > 0).length, 0);
  const dueWords = books.reduce((sum, book) => sum + book.words.filter((word) => isDue(word)).length, 0);
  const favoriteWords = books.reduce((sum, book) => sum + book.words.filter((word) => word.favorite).length, 0);
  return {
    totalWords,
    learned,
    unlearned: totalWords - learned,
    wrongWords,
    dueWords,
    favoriteWords,
    totalAnswered: records.totalAnswered,
    totalCorrect: records.totalCorrect,
    totalWrong: records.totalWrong,
    accuracy: records.totalAnswered ? Math.round((records.totalCorrect / records.totalAnswered) * 1000) / 10 : 0,
  };
};

export const createOptions = (book, currentWord) => {
  const distractors = shuffle(
    book.words
      .filter((word) => word.id !== currentWord.id && word.meaning !== currentWord.meaning)
      .map((word) => word.meaning),
  ).slice(0, 3);

  return shuffle([currentWord.meaning, ...distractors]).map((label, index) => ({
    id: `${currentWord.id}-option-${index}`,
    label,
    isCorrect: label === currentWord.meaning,
  }));
};

export const selectWordsForSession = (book, config) => {
  const source =
    config.mode === "due"
      ? book.words.filter((word) => isDue(word))
      : config.mode === "wrong"
      ? book.words.filter((word) => word.wrongCount > 0)
      : config.mode === "favorite"
        ? book.words.filter((word) => word.favorite)
      : config.mode === "all"
        ? book.words
        : config.mode === "learned"
          ? book.words.filter((word) => word.learned)
          : book.words.filter((word) => !word.learned);

  const ordered = config.order === "random" ? shuffle(source) : [...source];
  return config.count === "all" ? ordered : ordered.slice(0, Number(config.count));
};

export const isDue = (word, now = new Date()) => {
  if (!word.learned && !word.dueAt) return false;
  if (!word.dueAt) return false;
  return new Date(word.dueAt).getTime() <= now.getTime();
};

export const updateReviewSchedule = (word, correct, nowValue = new Date()) => {
  const now = new Date(nowValue);
  const previousEase = Number(word.ease) || 2.5;
  const previousInterval = Number(word.intervalDays) || 0;
  const previousReviews = Number(word.reviewCount) || 0;

  if (!correct) {
    const intervalDays = 1;
    const dueAt = new Date(now);
    dueAt.setDate(dueAt.getDate() + intervalDays);
    return {
      ease: Math.max(1.3, previousEase - 0.25),
      intervalDays,
      reviewCount: previousReviews + 1,
      dueAt: dueAt.toISOString(),
    };
  }

  const ease = Math.min(3.2, previousEase + 0.08);
  const intervalDays = previousInterval <= 0 ? 1 : previousInterval === 1 ? 3 : Math.ceil(previousInterval * ease);
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);
  return {
    ease,
    intervalDays,
    reviewCount: previousReviews + 1,
    dueAt: dueAt.toISOString(),
  };
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

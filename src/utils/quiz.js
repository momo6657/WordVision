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
  return {
    total,
    learned,
    unlearned: total - learned,
    wrong,
    progress: total ? Math.round((learned / total) * 100) : 0,
  };
};

export const getAllStats = (books, records) => {
  const totalWords = books.reduce((sum, book) => sum + book.words.length, 0);
  const learned = books.reduce((sum, book) => sum + book.words.filter((word) => word.learned).length, 0);
  const wrongWords = books.reduce((sum, book) => sum + book.words.filter((word) => word.wrongCount > 0).length, 0);
  return {
    totalWords,
    learned,
    unlearned: totalWords - learned,
    wrongWords,
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
    config.mode === "wrong"
      ? book.words.filter((word) => word.wrongCount > 0)
      : config.mode === "all"
        ? book.words
        : config.mode === "learned"
          ? book.words.filter((word) => word.learned)
          : book.words.filter((word) => !word.learned);

  const ordered = config.order === "random" ? shuffle(source) : [...source];
  return config.count === "all" ? ordered : ordered.slice(0, Number(config.count));
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

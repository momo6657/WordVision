export const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const fallbackMeanings = ["重要的", "发展", "交流", "机会", "挑战", "方法", "环境", "经验"];

export const getBookStats = (book) => {
  if (!book.words?.length && book.progressStats) return book.progressStats;
  const total = book.words?.length || book.totalCount || 0;
  let learned = 0;
  let wrong = 0;
  let due = 0;
  let favorite = 0;
  for (const word of book.words || []) {
    if (word.learned) learned += 1;
    if (word.wrongCount > 0) wrong += 1;
    if (isDue(word)) due += 1;
    if (word.favorite) favorite += 1;
  }
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
  const bookStats = books.map((book) => getBookStats(book));
  const totalWords = bookStats.reduce((sum, stats) => sum + stats.total, 0);
  const learned = bookStats.reduce((sum, stats) => sum + stats.learned, 0);
  const wrongWords = bookStats.reduce((sum, stats) => sum + stats.wrong, 0);
  const dueWords = bookStats.reduce((sum, stats) => sum + stats.due, 0);
  const favoriteWords = bookStats.reduce((sum, stats) => sum + stats.favorite, 0);
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
  const distractors = [];
  const used = new Set([currentWord.meaning]);
  const maxAttempts = Math.min(book.words.length * 3, 200);
  let attempts = 0;

  while (distractors.length < 3 && attempts < maxAttempts) {
    attempts += 1;
    const candidate = book.words[Math.floor(Math.random() * book.words.length)];
    if (!candidate || candidate.id === currentWord.id || used.has(candidate.meaning)) continue;
    used.add(candidate.meaning);
    distractors.push(candidate.meaning);
  }

  if (distractors.length < 3) {
    for (const word of book.words) {
      if (word.id === currentWord.id || used.has(word.meaning)) continue;
      used.add(word.meaning);
      distractors.push(word.meaning);
      if (distractors.length >= 3) break;
    }
  }
  for (const label of fallbackMeanings) {
    if (distractors.length >= 3) break;
    if (used.has(label)) continue;
    used.add(label);
    distractors.push(label);
  }

  return shuffle([currentWord.meaning, ...distractors]).map((label, index) => ({
    id: `${currentWord.id}-option-${index}`,
    label,
    isCorrect: label === currentWord.meaning,
  }));
};

export const countWordsForSession = (book, mode) => {
  if (mode === "due") return book.words.filter((word) => isDue(word)).length;
  if (mode === "wrong") return book.words.filter((word) => word.wrongCount > 0).length;
  if (mode === "favorite") return book.words.filter((word) => word.favorite).length;
  if (mode === "learned") return book.words.filter((word) => word.learned).length;
  return mode === "all" ? book.words.length : book.words.filter((word) => !word.learned).length;
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

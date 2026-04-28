import StatusBadge from "../components/StatusBadge.jsx";

export default function Mistakes({ books, onReview, onClear, onMarkLearned, onDetail }) {
  const mistakes = books.flatMap((book) => book.words.filter((word) => word.wrongCount > 0).map((word) => ({ ...word, bookId: book.id, bookName: book.name })));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black">错题本</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">所有答错过的单词会自动进入这里。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" disabled={!mistakes.length} onClick={onReview}>
            复习错题
          </button>
          <button
            className="btn-danger"
            disabled={!mistakes.length}
            onClick={() => {
              if (window.confirm("确定要清空所有错题记录吗？")) onClear();
            }}
          >
            清空错题记录
          </button>
        </div>
      </div>

      {!mistakes.length ? (
        <div className="panel p-10 text-center">
          <h2 className="text-xl font-bold">暂无错题，继续保持！</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">开始学习后，答错的单词会出现在这里。</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mistakes.map((word) => (
            <article key={word.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <button className="text-xl font-black text-blue-700 hover:underline dark:text-blue-300" onClick={() => onDetail(word)}>
                    {word.word}
                  </button>
                  <p className="text-sm text-slate-500">{word.bookName}</p>
                </div>
                <StatusBadge word={word} />
              </div>
              <p className="mt-3 font-semibold">{word.meaning}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{word.example}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{word.exampleCn}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm text-orange-700 dark:text-orange-200">错误次数：{word.wrongCount}</span>
                <button className="btn-secondary" onClick={() => onMarkLearned(word.id)}>
                  标记为已掌握
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

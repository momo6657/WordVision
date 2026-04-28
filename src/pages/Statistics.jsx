import ProgressBar from "../components/ProgressBar.jsx";
import StatCard from "../components/StatCard.jsx";
import { formatDateTime, getAllStats, getBookStats } from "../utils/quiz.js";

export default function Statistics({ books, records }) {
  const stats = getAllStats(books, records);
  const recentSessions = [...records.sessions].slice(-6).reverse();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black">学习统计</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">查看所有词库的整体进度和最近学习记录。</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="总词数" value={stats.totalWords} tone="blue" />
        <StatCard label="已学会" value={stats.learned} tone="green" />
        <StatCard label="未学会" value={stats.unlearned} tone="slate" />
        <StatCard label="错题数" value={stats.wrongWords} tone="orange" />
        <StatCard label="总答题" value={stats.totalAnswered} tone="blue" />
        <StatCard label="错误次数" value={stats.totalWrong} tone="red" />
        <StatCard label="正确率" value={`${stats.accuracy}%`} tone="green" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_.9fr]">
        <section className="panel p-5">
          <h2 className="text-xl font-bold">各词库进度</h2>
          <div className="mt-5 space-y-5">
            {books.map((book) => {
              const bookStats = getBookStats(book);
              return (
                <div key={book.id}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">{book.name}</span>
                    <span>
                      {bookStats.learned} / {bookStats.total} · {bookStats.progress}%
                    </span>
                  </div>
                  <ProgressBar value={bookStats.progress} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xl font-bold">最近学习记录</h2>
          {!recentSessions.length ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">暂无学习记录。</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                  <div className="flex justify-between gap-3">
                    <span className="font-bold">{session.bookName}</span>
                    <span className="text-slate-500">{formatDateTime(session.date)}</span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    {session.modeLabel} · {session.total} 题 · 答对 {session.correct} · 答错 {session.wrong}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

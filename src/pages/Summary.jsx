import ProgressBar from "../components/ProgressBar.jsx";
import StatCard from "../components/StatCard.jsx";
import { getBookStats } from "../utils/quiz.js";

export default function Summary({ book, summary, onContinue, onWrong, onOverview, onBooks }) {
  const stats = getBookStats(book);
  const accuracy = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="panel p-6">
        <h1 className="text-3xl font-black">本轮学习完成！</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">继续下一轮，或回到总览查看完整学习状态。</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          <StatCard label="本轮单词" value={summary.total} tone="blue" />
          <StatCard label="答对" value={summary.correct} tone="green" />
          <StatCard label="答错" value={summary.wrong} tone="red" />
          <StatCard label="新学会" value={summary.newLearned} tone="orange" />
          <StatCard label="正确率" value={`${accuracy}%`} tone="slate" />
        </div>

        <div className="mt-7 rounded-lg bg-slate-50 p-5 dark:bg-slate-800">
          <h2 className="font-bold">当前词库总进度：{book.name}</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {stats.learned} / {stats.total}，学习进度 {stats.progress}%
          </p>
          <div className="mt-3">
            <ProgressBar value={stats.progress} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={onContinue}>
            继续学习未学会单词
          </button>
          <button className="btn-secondary" onClick={onWrong}>
            复习答错单词
          </button>
          <button className="btn-secondary" onClick={onOverview}>
            返回词汇总览
          </button>
          <button className="btn-secondary" onClick={onBooks}>
            返回词库选择
          </button>
        </div>
      </div>
    </main>
  );
}

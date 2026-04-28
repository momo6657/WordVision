import { BookOpen, Eye } from "lucide-react";
import ProgressBar from "./ProgressBar.jsx";
import { getBookStats } from "../utils/quiz.js";

export default function BookCard({ book, onOverview, onStudy }) {
  const stats = getBookStats(book);

  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">{book.level}</p>
          <h3 className="mt-1 text-xl font-bold">{book.name}</h3>
          <p className="mt-2 min-h-12 text-sm text-slate-600 dark:text-slate-300">{book.description}</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <BookOpen size={22} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
          <div className="font-bold">{stats.total}</div>
          <div className="text-xs text-slate-500">总词数</div>
        </div>
        <div className="rounded-md bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
          <div className="font-bold">{stats.learned}</div>
          <div className="text-xs">已学会</div>
        </div>
        <div className="rounded-md bg-orange-50 p-3 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200">
          <div className="font-bold">{stats.wrong}</div>
          <div className="text-xs">答错过</div>
        </div>
      </div>

      <div className="mt-5">
        <ProgressBar value={stats.progress} label={`学习进度 ${stats.progress}%`} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button className="btn-secondary" onClick={() => onOverview(book.id)}>
          <Eye size={16} />
          查看词汇
        </button>
        <button className="btn-primary" onClick={() => onStudy(book.id)}>
          开始学习
        </button>
      </div>
    </article>
  );
}

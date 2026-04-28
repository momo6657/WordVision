export default function StatusBadge({ word }) {
  if (word.learned && word.wrongCount > 0) {
    return <span className="chip bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">已掌握，曾答错</span>;
  }
  if (word.learned) {
    return <span className="chip bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">已学会</span>;
  }
  if (word.wrongCount > 0) {
    return <span className="chip bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200">答错过</span>;
  }
  return <span className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">未学会</span>;
}

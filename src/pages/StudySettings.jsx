import { useMemo, useState } from "react";
import { getBookStats, selectWordsForSession } from "../utils/quiz.js";

const modes = [
  { id: "due", label: "今日应复习" },
  { id: "unlearned", label: "新词学习" },
  { id: "wrong", label: "错题强化" },
  { id: "favorite", label: "收藏重点" },
  { id: "all", label: "随机练习全部单词" },
  { id: "learned", label: "重新学习已学会单词" },
];

const counts = ["5", "10", "15", "all"];

export default function StudySettings({ book, initialMode = "unlearned", onStart, onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [count, setCount] = useState("10");
  const [order, setOrder] = useState("random");
  const stats = getBookStats(book);
  const preview = useMemo(() => selectWordsForSession(book, { mode, count, order }), [book, count, mode, order]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black">学习设置</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          当前词库：{book.name}，已学会 {stats.learned} / {stats.total}
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
          今日应复习 <strong>{stats.due}</strong>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          未学会 <strong>{stats.unlearned}</strong>
        </div>
        <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-800 dark:bg-orange-950/40 dark:text-orange-100">
          错题 <strong>{stats.wrong}</strong>
        </div>
        <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-100">
          收藏 <strong>{stats.favorite}</strong>
        </div>
      </div>

      <div className="panel p-5">
        <section>
          <h2 className="text-lg font-bold">学习模式</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {modes.map((item) => (
              <button
                key={item.id}
                className={mode === item.id ? "btn-primary justify-start" : "btn-secondary justify-start"}
                onClick={() => setMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-bold">本轮数量</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {counts.map((item) => (
              <button key={item} className={count === item ? "btn-primary" : "btn-secondary"} onClick={() => setCount(item)}>
                {item === "all" ? "全部" : `${item} 个`}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-bold">题目顺序</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <button className={order === "ordered" ? "btn-primary" : "btn-secondary"} onClick={() => setOrder("ordered")}>
              顺序学习
            </button>
            <button className={order === "random" ? "btn-primary" : "btn-secondary"} onClick={() => setOrder("random")}>
              随机学习
            </button>
          </div>
        </section>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          本轮预计学习 <strong className="text-slate-900 dark:text-white">{preview.length}</strong> 个单词。
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={!preview.length} onClick={() => onStart({ mode, count, order })}>
            开始本轮学习
          </button>
          <button className="btn-secondary" onClick={onBack}>
            返回词汇总览
          </button>
        </div>
      </div>
    </main>
  );
}

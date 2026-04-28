import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import ProgressBar from "../components/ProgressBar.jsx";
import StatCard from "../components/StatCard.jsx";
import WordList from "../components/WordList.jsx";
import { getBookStats } from "../utils/quiz.js";

const filters = [
  { id: "all", label: "全部" },
  { id: "unlearned", label: "未学会" },
  { id: "learned", label: "已学会" },
  { id: "wrong", label: "答错过" },
];

export default function WordOverview({ book, onStartMode, onReset, onDetail, onToggleFavorite, onSpeak }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const stats = getBookStats(book);

  const visibleWords = useMemo(() => {
    return book.words.filter((word) => {
      const matchesQuery = word.word.toLowerCase().includes(query.trim().toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "unlearned" && !word.learned) ||
        (filter === "learned" && word.learned) ||
        (filter === "wrong" && word.wrongCount > 0);
      return matchesQuery && matchesFilter;
    });
  }, [book.words, filter, query]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{book.level}</p>
          <h1 className="text-3xl font-black">{book.name}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{book.description}</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => {
            if (window.confirm("确定要重置当前词库学习进度吗？")) onReset(book.id);
          }}
        >
          <RotateCcw size={16} />
          重置进度
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <StatCard label="总词数" value={stats.total} tone="blue" />
        <StatCard label="已学会" value={stats.learned} tone="green" />
        <StatCard label="未学会" value={stats.unlearned} tone="slate" />
        <StatCard label="答错过" value={stats.wrong} tone="orange" />
      </div>

      <div className="panel mb-5 p-5">
        <ProgressBar value={stats.progress} label={`当前学习进度 ${stats.progress}%`} />
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input className="input" placeholder="搜索英文单词，例如 ab" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.id}
                className={filter === item.id ? "btn-primary" : "btn-secondary"}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => onStartMode(book.id, "unlearned")}>
            开始学习未学会单词
          </button>
          <button className="btn-secondary" onClick={() => onStartMode(book.id, "wrong")}>
            复习答错单词
          </button>
          <button className="btn-secondary" onClick={() => onStartMode(book.id, "all")}>
            重新学习全部单词
          </button>
        </div>
      </div>

      <WordList words={visibleWords} onDetail={onDetail} onToggleFavorite={onToggleFavorite} onSpeak={onSpeak} />
    </main>
  );
}

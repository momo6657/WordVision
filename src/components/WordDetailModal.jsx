import { X } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

export default function WordDetailModal({ word, onClose, onToggleFavorite, onSpeak }) {
  if (!word) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{word.word}</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{word.phonetic}</p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge word={word} />
          {word.favorite ? <span className="chip bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">重点收藏</span> : null}
        </div>

        <div className="mt-5 grid gap-4">
          <section>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">中文释义</h3>
            <p className="mt-1 text-lg font-semibold">{word.meaning}</p>
          </section>
          <section>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">例句</h3>
            <p className="mt-1">{word.example}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{word.exampleCn}</p>
          </section>
          <section>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">AI 记忆提示</h3>
            <p className="mt-1">{word.memoryTip}</p>
          </section>
          <section>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">图片提示词</h3>
            <p className="mt-1 rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{word.imagePrompt}</p>
          </section>
          {word.imageUrl ? (
            <section>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">AI 图片</h3>
              <img className="mt-2 aspect-[4/3] w-full rounded-lg object-cover" src={word.imageUrl} alt={word.word} />
              <p className="mt-2 text-xs text-slate-500">
                {word.imageProvider || "provider"} / {word.imageModel || "model"}
              </p>
            </section>
          ) : null}
          {word.dueAt ? (
            <section>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">复习计划</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                下次复习：{new Date(word.dueAt).toLocaleString("zh-CN")} · 间隔 {word.intervalDays || 0} 天 · 复习 {word.reviewCount || 0} 次
              </p>
            </section>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => onSpeak(word.word)}>
            发音
          </button>
          <button className="btn-secondary" onClick={() => onToggleFavorite(word.id)}>
            {word.favorite ? "取消收藏" : "加入重点"}
          </button>
        </div>
      </div>
    </div>
  );
}

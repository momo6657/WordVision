import { Volume2 } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { formatDateTime } from "../utils/quiz.js";

export default function WordList({ words, onDetail, onToggleFavorite, onSpeak }) {
  if (!words.length) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">没有匹配的词汇</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">可以调整搜索关键词或筛选条件。</p>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="hidden grid-cols-[1.1fr_1.4fr_1fr_.7fr_1fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900 md:grid">
        <span>英文单词</span>
        <span>中文释义</span>
        <span>学习状态</span>
        <span>错误次数</span>
        <span>最近学习</span>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {words.map((word) => (
          <div key={word.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1.1fr_1.4fr_1fr_.7fr_1fr] md:items-center">
            <div>
              <button className="font-bold text-blue-700 hover:underline dark:text-blue-300" onClick={() => onDetail(word)}>
                {word.word}
              </button>
              <div className="text-xs text-slate-500">{word.phonetic}</div>
            </div>
            <div className="text-sm">{word.meaning}</div>
            <StatusBadge word={word} />
            <div className="text-sm">{word.wrongCount}</div>
            <div className="flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span title={word.dueAt ? `下次复习：${formatDateTime(word.dueAt)}` : ""}>{formatDateTime(word.lastStudiedAt)}</span>
              <div className="flex gap-1">
                <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => onSpeak(word.word)} title="朗读">
                  <Volume2 size={16} />
                </button>
                <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => onToggleFavorite(word.id)} title="收藏">
                  {word.favorite ? "★" : "☆"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { analyzeSentence } from "../utils/aiApi.js";

export default function SentenceLab({ records, onSaveRecord }) {
  const [sentence, setSentence] = useState("Although the task seemed difficult at first, the students gradually understood the structure after the teacher broke it down.");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const analyze = async () => {
    if (!sentence.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const payload = await analyzeSentence({ sentence, level: "中级" });
      setAnalysis(payload.analysis);
    } catch (error) {
      setMessage(error.message || "长难句解析失败");
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!analysis) return;
    onSaveRecord({ id: `sentence-${Date.now()}`, ...analysis, createdAt: new Date().toISOString() });
    setMessage("长难句记录已保存。");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold text-blue-600 dark:text-blue-300">长难句理解</p>
        <h1 className="text-3xl font-black">结构拆解、翻译和理解练习</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">先抓主干，再看从句和修饰成分，把复杂句拆成可理解的步骤。</p>
      </div>

      <section className="panel p-5">
        <textarea className="input min-h-32" value={sentence} onChange={(event) => setSentence(event.target.value)} placeholder="粘贴英文长难句" />
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={loading} onClick={analyze}>{loading ? "解析中..." : "解析长难句"}</button>
          <button className="btn-secondary" disabled={!analysis} onClick={save}>保存记录</button>
        </div>
        {message ? <p className="mt-3 text-sm text-blue-700 dark:text-blue-200">{message}</p> : null}
      </section>

      {analysis ? (
        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <div className="panel p-5">
            <h2 className="text-xl font-bold">解析结果</h2>
            <p className="mt-3 text-lg">{analysis.sentence}</p>
            <p className="mt-3 rounded-lg bg-blue-50 p-3 font-semibold text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">{analysis.translation}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><strong>主语</strong><p>{analysis.mainStructure?.subject}</p></div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><strong>谓语</strong><p>{analysis.mainStructure?.predicate}</p></div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><strong>宾语/补足语</strong><p>{analysis.mainStructure?.object}</p></div>
            </div>
            <h3 className="mt-5 font-bold">结构拆解</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
              {analysis.clauses?.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="text-xl font-bold">重点词与练习</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {analysis.keyWords?.map((item) => <span key={item.word} className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{item.word} · {item.meaning}</span>)}
            </div>
            <div className="mt-5 space-y-3">
              {analysis.exercises?.map((item, index) => (
                <div key={index} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                  <strong>{item.question}</strong>
                  <p className="mt-1 text-slate-500">参考：{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {records.length ? (
        <section className="mt-6 panel p-5">
          <h2 className="text-xl font-bold">已保存长难句</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {records.slice(-6).reverse().map((record) => (
              <article key={record.id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                <p className="font-semibold">{record.sentence}</p>
                <p className="mt-1 text-slate-500">{record.translation}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

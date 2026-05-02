import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { parseCustomWordRows } from "../utils/customWords.js";
import WordList from "../components/WordList.jsx";

const emptyForm = { word: "", meaning: "", phonetic: "", example: "", exampleCn: "", scene: "", tags: "", memoryTip: "" };

export default function CustomWords({ book, onSaveWord, onDeleteWord, onImportWords, onStartMode, onDetail, onToggleFavorite, onSpeak }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [batchText, setBatchText] = useState("");
  const [query, setQuery] = useState("");

  const visibleWords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return book.words.filter((word) => !q || word.word.includes(q) || word.meaning.includes(q) || word.scene?.includes(q));
  }, [book.words, query]);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    if (!form.word.trim() || !form.meaning.trim()) return;
    onSaveWord({ ...form, id: editingId || undefined });
    setForm(emptyForm);
    setEditingId("");
  };

  const editWord = (word) => {
    setEditingId(word.id);
    setForm({
      word: word.word,
      meaning: word.meaning,
      phonetic: word.phonetic || "",
      example: word.example || "",
      exampleCn: word.exampleCn || "",
      scene: word.scene || "",
      tags: Array.isArray(word.tags) ? word.tags.join(", ") : word.sourceTags || "",
      memoryTip: word.memoryTip || "",
    });
  };

  const importRows = () => {
    const rows = parseCustomWordRows(batchText);
    if (!rows.length) return;
    onImportWords(rows);
    setBatchText("");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-300">自定义词库</p>
          <h1 className="text-3xl font-black">自定义添加词汇</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">添加单词、短语、情景和标签，生成自己的视觉单词卡。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" disabled={!book.words.length} onClick={() => onStartMode(book.id, "unlearned")}>
            学习自定义词
          </button>
          <button className="btn-secondary" disabled={!book.words.length} onClick={() => onStartMode(book.id, "all")}>
            随机练习
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="panel p-5">
          <h2 className="text-xl font-bold">{editingId ? "编辑词条" : "手动添加"}</h2>
          <div className="mt-4 grid gap-3">
            <input className="input" placeholder="英文单词或短语 *" value={form.word} onChange={(event) => updateField("word", event.target.value)} />
            <input className="input" placeholder="中文释义 *" value={form.meaning} onChange={(event) => updateField("meaning", event.target.value)} />
            <input className="input" placeholder="音标，可选" value={form.phonetic} onChange={(event) => updateField("phonetic", event.target.value)} />
            <input className="input" placeholder="情景，例如 餐厅点餐" value={form.scene} onChange={(event) => updateField("scene", event.target.value)} />
            <input className="input" placeholder="标签，逗号分隔" value={form.tags} onChange={(event) => updateField("tags", event.target.value)} />
            <textarea className="input min-h-20" placeholder="英文例句" value={form.example} onChange={(event) => updateField("example", event.target.value)} />
            <textarea className="input min-h-20" placeholder="中文翻译" value={form.exampleCn} onChange={(event) => updateField("exampleCn", event.target.value)} />
            <textarea className="input min-h-20" placeholder="记忆提示，可选" value={form.memoryTip} onChange={(event) => updateField("memoryTip", event.target.value)} />
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={submit}>
                <Plus size={16} />
                {editingId ? "保存修改" : "添加词汇"}
              </button>
              {editingId ? (
                <button className="btn-secondary" onClick={() => { setEditingId(""); setForm(emptyForm); }}>
                  取消编辑
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-xl font-bold">批量粘贴导入</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">每行格式：word, meaning, phonetic, example, exampleCn, scene, tags。也支持 TSV。</p>
          <textarea className="input mt-4 min-h-48" value={batchText} onChange={(event) => setBatchText(event.target.value)} placeholder="restaurant, 餐厅, /ˈrestrɒnt/, We booked a table at the restaurant., 我们在餐厅订了桌。, 餐厅点餐, food" />
          <button className="btn-primary mt-4" onClick={importRows}>
            导入词汇
          </button>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="text-xl font-bold">我的词汇（{book.words.length}）</h2>
          <input className="input md:max-w-xs" placeholder="搜索自定义词、释义或情景" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <WordList words={visibleWords} onDetail={onDetail} onToggleFavorite={onToggleFavorite} onSpeak={onSpeak} />
        {visibleWords.length ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {visibleWords.map((word) => (
              <div key={word.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="font-semibold">{word.word}</span>
                <div className="flex gap-2">
                  <button className="btn-secondary px-3 py-1.5" onClick={() => editWord(word)}>编辑</button>
                  <button className="btn-danger px-3 py-1.5" onClick={() => onDeleteWord(word.id)}>
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

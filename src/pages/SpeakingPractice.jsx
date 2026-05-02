import { useMemo, useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import { generateDialogue } from "../utils/aiApi.js";

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);

const scoreTranscript = (target, transcript) => {
  const targetWords = normalize(target);
  const spoken = new Set(normalize(transcript));
  if (!targetWords.length) return { score: 0, missing: [] };
  const hit = targetWords.filter((word) => spoken.has(word));
  return { score: Math.round((hit.length / targetWords.length) * 100), missing: targetWords.filter((word) => !spoken.has(word)).slice(0, 8) };
};

export default function SpeakingPractice({ records, onSaveRecord, onSpeak }) {
  const [scene, setScene] = useState("餐厅点餐");
  const [dialogue, setDialogue] = useState(null);
  const [activeLine, setActiveLine] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const feedback = useMemo(() => (activeLine ? scoreTranscript(activeLine.sentence, transcript) : { score: 0, missing: [] }), [activeLine, transcript]);

  const createDialogue = async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = await generateDialogue({ scene, role: "Learner", level: "中级", turns: 6 });
      setDialogue(payload.dialogue);
      setActiveLine(payload.dialogue.lines?.[0] || null);
      setTranscript("");
    } catch (error) {
      setMessage(error.message || "对话生成失败");
    } finally {
      setLoading(false);
    }
  };

  const startRecognition = () => {
    if (!SpeechRecognition) {
      setMessage("当前浏览器不支持语音识别，请使用手动输入模式。");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => setTranscript(event.results[0][0].transcript);
    recognition.onerror = () => setMessage("语音识别失败，请重试或手动输入。");
    recognition.start();
  };

  const savePractice = () => {
    if (!activeLine) return;
    onSaveRecord({
      id: `speaking-${Date.now()}`,
      scene,
      sentence: activeLine.sentence,
      transcript,
      score: feedback.score,
      practicedAt: new Date().toISOString(),
    });
    setMessage("练习记录已保存。");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold text-blue-600 dark:text-blue-300">口语练习</p>
        <h1 className="text-3xl font-black">情景对话、跟读和反馈</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">使用浏览器语音识别辅助练习，不做音素级专业评分。</p>
      </div>

      <section className="panel p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input className="input" value={scene} onChange={(event) => setScene(event.target.value)} placeholder="输入口语情景" />
          <button className="btn-primary" disabled={loading} onClick={createDialogue}>{loading ? "生成中..." : "生成对话"}</button>
        </div>
        {message ? <p className="mt-3 text-sm text-blue-700 dark:text-blue-200">{message}</p> : null}
      </section>

      {dialogue ? (
        <section className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <div className="panel p-5">
            <h2 className="text-xl font-bold">{dialogue.title}</h2>
            <div className="mt-4 grid gap-3">
              {dialogue.lines.map((line, index) => (
                <button key={`${line.role}-${index}`} className={`rounded-lg border p-3 text-left ${activeLine === line ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-slate-800"}`} onClick={() => { setActiveLine(line); setTranscript(""); }}>
                  <strong>{line.role}</strong>
                  <p className="mt-1">{line.sentence}</p>
                  <p className="mt-1 text-sm text-slate-500">{line.translation}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="text-xl font-bold">跟读反馈</h2>
            {activeLine ? (
              <>
                <p className="mt-3 text-lg font-semibold">{activeLine.sentence}</p>
                <p className="mt-1 text-slate-500">{activeLine.translation}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="btn-secondary" onClick={() => onSpeak(activeLine.sentence)}><Volume2 size={16} />朗读</button>
                  <button className="btn-primary" onClick={startRecognition}><Mic size={16} />开始识别</button>
                </div>
                <textarea className="input mt-4 min-h-28" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="识别结果会显示在这里；不支持语音识别时可手动输入。" />
                <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="font-bold">相似度：{feedback.score}%</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">缺失/疑似误读：{feedback.missing.length ? feedback.missing.join(", ") : "无明显缺失"}</p>
                </div>
                <button className="btn-primary mt-4" onClick={savePractice}>保存练习记录</button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {records.length ? (
        <section className="mt-6 panel p-5">
          <h2 className="text-xl font-bold">最近口语记录</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {records.slice(-6).reverse().map((record) => (
              <div key={record.id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                <strong>{record.score}% · {record.scene}</strong>
                <p className="mt-1">{record.sentence}</p>
                <p className="mt-1 text-slate-500">{record.transcript}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

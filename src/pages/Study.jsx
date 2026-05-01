import { useEffect, useRef, useState } from "react";
import { RefreshCcw, Volume2 } from "lucide-react";
import OptionButton from "../components/OptionButton.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { createOptions } from "../utils/quiz.js";
import { generateWordImage } from "../utils/imageApi.js";

const isGeneratedByFakeProvider = (word) =>
  ["mock", "client-mock"].includes(word?.imageProvider) || /mock|local|svg|anime-png/i.test(word?.imageModel || "");

const PREFETCH_AHEAD_COUNT = 2;

export default function Study({ book, sessionWords, onAnswer, onFinish, onSpeak, onToggleFavorite, onImageUpdate }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const currentWord = sessionWords[index];
  const [options, setOptions] = useState([]);
  const [imageState, setImageState] = useState({ status: "idle", imageUrl: "", message: "" });
  const prefetchingIds = useRef(new Set());

  useEffect(() => {
    if (currentWord) {
      setOptions(createOptions(book, currentWord));
      setSelected(null);
      setResult(null);
      setImageState({
        status: currentWord.imageUrl && !isGeneratedByFakeProvider(currentWord) ? "ready" : currentWord.imageStatus || "idle",
        imageUrl: currentWord.imageUrl && !isGeneratedByFakeProvider(currentWord) ? currentWord.imageUrl : "",
        message: currentWord.imageError || "",
        provider: currentWord.imageUrl && !isGeneratedByFakeProvider(currentWord) ? currentWord.imageProvider || "" : "",
        model: currentWord.imageUrl && !isGeneratedByFakeProvider(currentWord) ? currentWord.imageModel || "" : "",
      });
    }
  }, [book.id, currentWord?.id]);

  useEffect(() => {
    if (!currentWord || currentWord.imageStatus === "loading") return;
    if (currentWord.imageUrl && !isGeneratedByFakeProvider(currentWord)) return;
    loadImage(Boolean(currentWord.imageUrl));
  }, [book.id, currentWord?.id]);

  useEffect(() => {
    if (imageState.status !== "ready") return;
    sessionWords.slice(index + 1, index + 1 + PREFETCH_AHEAD_COUNT).forEach((nextWord) => {
      if (!nextWord || prefetchingIds.current.has(nextWord.id)) return;
      if (nextWord.imageStatus === "loading") return;
      if (nextWord.imageUrl && !isGeneratedByFakeProvider(nextWord)) return;

      prefetchingIds.current.add(nextWord.id);
      onImageUpdate?.(nextWord.id, {
        imageUrl: "",
        imageStatus: "loading",
        imageProvider: "",
        imageModel: "",
        imageGeneratedAt: null,
        imageError: "",
      });

      generateWordImage({ bookId: book.id, wordId: nextWord.id, force: Boolean(nextWord.imageUrl) })
        .then((payload) => {
          onImageUpdate?.(nextWord.id, {
            imageUrl: payload.imageUrl,
            imageStatus: "ready",
            imageProvider: payload.provider,
            imageModel: payload.model,
            imageGeneratedAt: new Date().toISOString(),
            imageError: "",
          });
        })
        .catch((error) => {
          onImageUpdate?.(nextWord.id, {
            imageUrl: "",
            imageStatus: "error",
            imageProvider: "",
            imageModel: "",
            imageGeneratedAt: null,
            imageError: error.message || "AI 图片生成失败",
          });
        });
    });
  }, [book.id, imageState.status, index, onImageUpdate, sessionWords]);

  const loadImage = async (force) => {
    if (!currentWord) return;
    setImageState({ status: "loading", imageUrl: "", message: force ? "正在重新生成真实 AI 图片..." : "正在生成真实 AI 图片..." });
    onImageUpdate?.(currentWord.id, {
      imageUrl: "",
      imageStatus: "loading",
      imageProvider: "",
      imageModel: "",
      imageGeneratedAt: null,
      imageError: "",
    });

    try {
      const payload = await generateWordImage({
        bookId: book.id,
        wordId: currentWord.id,
        force,
      });
      const nextState = {
        imageUrl: payload.imageUrl,
        imageStatus: "ready",
        imageProvider: payload.provider,
        imageModel: payload.model,
        imageGeneratedAt: new Date().toISOString(),
        imageError: "",
      };
      setImageState({
        status: nextState.imageStatus,
        imageUrl: nextState.imageUrl,
        message: payload.message,
        provider: payload.provider,
        model: payload.model,
      });
      onImageUpdate?.(currentWord.id, nextState);
    } catch (error) {
      const message = error.message || "AI 图片生成失败";
      setImageState({ status: "error", imageUrl: "", message });
      onImageUpdate?.(currentWord.id, {
        imageUrl: "",
        imageStatus: "error",
        imageProvider: "",
        imageModel: "",
        imageGeneratedAt: null,
        imageError: message,
      });
    }
  };

  if (!currentWord) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="panel p-8 text-center">
          <h1 className="text-2xl font-black">暂无可学习单词</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">请返回学习设置更换模式。</p>
        </div>
      </main>
    );
  }

  const handleSelect = (option) => {
    if (result) return;
    setSelected(option);
    const answerResult = onAnswer(currentWord, option);
    setResult({ ...answerResult, selectedLabel: option.label });
  };

  const handleNext = () => {
    if (index + 1 >= sessionWords.length) {
      onFinish();
      return;
    }
    setIndex((value) => value + 1);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-blue-600 dark:text-blue-300">当前词库：{book.name}</p>
          <h1 className="mt-1 text-3xl font-black">本轮进度：{index + 1} / {sessionWords.length}</h1>
        </div>
        <div className="min-w-48">
          <ProgressBar value={Math.round(((index + 1) / sessionWords.length) * 100)} />
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="grid gap-6 p-5 lg:grid-cols-[.95fr_1.05fr]">
          <section>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">英文单词</p>
                <h2 className="mt-2 text-5xl font-black tracking-normal">{currentWord.word}</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">{currentWord.phonetic}</p>
              </div>
              <button className="btn-secondary px-3" onClick={() => onSpeak(currentWord.word)} title="发音">
                <Volume2 size={17} />
              </button>
            </div>

            <div className="mt-6 grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-emerald-50 p-5 text-center dark:border-blue-800 dark:from-blue-950/40 dark:to-emerald-950/30">
              {imageState.imageUrl ? (
                <img className="h-full w-full rounded-md object-cover" src={imageState.imageUrl} alt={currentWord.word} />
              ) : (
                <div>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-200">
                    {imageState.status === "loading" ? "真实 AI 图片生成中" : imageState.status === "error" ? "需要配置真实图片 API" : "等待生成真实 AI 图片"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">图片准备好后会自动显示，请先根据画面判断选项。</p>
                  {imageState.message ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{imageState.message}</p> : null}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span>
                观察图片，选择正确的中文释义。
                {imageState.provider ? ` · ${imageState.provider}/${imageState.model}` : ""}
              </span>
              <button className="btn-secondary px-3 py-1.5" disabled={imageState.status === "loading"} onClick={() => loadImage(true)}>
                <RefreshCcw size={15} />
                重新生成
              </button>
            </div>
          </section>

          <section>
            <div className="grid gap-3">
              {options.map((option) => (
                <OptionButton
                  key={option.id}
                  option={option}
                  selected={selected?.id === option.id}
                  answered={Boolean(result)}
                  onSelect={() => handleSelect(option)}
                />
              ))}
            </div>

            {result ? (
              <div
                className={`mt-5 rounded-lg border p-4 ${
                  result.correct
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                    : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                }`}
              >
                <h3 className="text-lg font-black">{result.correct ? "回答正确！" : "回答错误"}</h3>
                <p className="mt-2">
                  {currentWord.word} = {currentWord.meaning}
                </p>
                {result.correct ? <p className="mt-1">这个单词已标记为已学会。</p> : null}
                {!result.correct ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p>你的选择：{result.selectedLabel}</p>
                    <p>正确答案：{currentWord.meaning}</p>
                    <p className="pt-2 font-semibold">{currentWord.example}</p>
                    <p>{currentWord.exampleCn}</p>
                    <p>{currentWord.memoryTip}</p>
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  {!result.correct ? (
                    <button className="btn-secondary" onClick={() => onToggleFavorite(currentWord.id)}>
                      加入重点复习
                    </button>
                  ) : null}
                  <button className="btn-primary" onClick={handleNext}>
                    {index + 1 >= sessionWords.length ? "查看本轮总结" : "下一个"}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

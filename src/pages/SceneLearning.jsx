import { useState } from "react";
import { ImagePlus, Sparkles } from "lucide-react";
import { generateScene } from "../utils/aiApi.js";
import { generateWordImage } from "../utils/imageApi.js";

const presets = ["餐厅点餐", "课堂提问", "旅行问路", "天气交流", "快递柜取件", "校园生活"];

export default function SceneLearning({ scenes, onSaveScene, onAddWordsToCustom }) {
  const [sceneText, setSceneText] = useState("餐厅点餐");
  const [wordCount, setWordCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [currentScene, setCurrentScene] = useState(null);
  const [message, setMessage] = useState("");

  const createScene = async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = await generateScene({ scene: sceneText, level: "中级", wordCount, style: "realistic" });
      const scene = {
        id: `scene-${Date.now()}`,
        ...payload.scene,
        imageUrl: "",
        imageStatus: "idle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentScene(scene);
      onSaveScene(scene);
    } catch (error) {
      setMessage(error.message || "情景生成失败");
    } finally {
      setLoading(false);
    }
  };

  const generateSceneImage = async () => {
    if (!currentScene) return;
    setImageLoading(true);
    try {
      const payload = await generateWordImage({
        bookId: "scene",
        wordId: currentScene.id,
        imageKind: "scene",
        wordPayload: {
          word: currentScene.title,
          meaning: currentScene.description,
          imagePrompt: currentScene.scenePrompt,
        },
      });
      const nextScene = { ...currentScene, imageUrl: payload.imageUrl, imageStatus: "ready", updatedAt: new Date().toISOString() };
      setCurrentScene(nextScene);
      onSaveScene(nextScene);
    } catch (error) {
      setMessage(error.message || "情景图片生成失败");
    } finally {
      setImageLoading(false);
    }
  };

  const addWords = () => {
    if (!currentScene?.words?.length) return;
    onAddWordsToCustom(currentScene.words.map((word) => ({ ...word, scene: currentScene.title, tags: [currentScene.title, ...(word.tags || [])] })));
    setMessage("已加入自定义词库，可在自定义词汇中继续学习。");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-bold text-blue-600 dark:text-blue-300">AI 情景学习</p>
        <h1 className="text-3xl font-black">生成情景、图片和词汇组</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">围绕具体生活情景生成视觉单词卡素材，适合沉浸式记忆。</p>
      </div>

      <section className="panel p-5">
        <div className="flex flex-wrap gap-2">
          {presets.map((item) => (
            <button key={item} className={sceneText === item ? "btn-primary" : "btn-secondary"} onClick={() => setSceneText(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
          <input className="input" value={sceneText} onChange={(event) => setSceneText(event.target.value)} placeholder="输入自定义情景，例如 医院挂号" />
          <select className="input" value={wordCount} onChange={(event) => setWordCount(event.target.value)}>
            <option value="8">8 个词</option>
            <option value="10">10 个词</option>
            <option value="15">15 个词</option>
            <option value="20">20 个词</option>
          </select>
          <button className="btn-primary" disabled={loading} onClick={createScene}>
            <Sparkles size={16} />
            {loading ? "生成中..." : "生成情景"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-blue-700 dark:text-blue-200">{message}</p> : null}
      </section>

      {currentScene ? (
        <section className="mt-6 grid gap-5 lg:grid-cols-[.95fr_1.05fr]">
          <div className="panel p-5">
            <h2 className="text-2xl font-black">{currentScene.title}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{currentScene.description}</p>
            <div className="mt-5 grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border border-dashed border-blue-300 bg-blue-50 text-center dark:border-blue-800 dark:bg-blue-950/30">
              {currentScene.imageUrl ? <img className="h-full w-full object-cover" src={currentScene.imageUrl} alt={currentScene.title} /> : <p className="font-bold text-blue-700 dark:text-blue-200">情景图片待生成</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn-primary" disabled={imageLoading} onClick={generateSceneImage}>
                <ImagePlus size={16} />
                {imageLoading ? "生成图片中..." : "生成情景图片"}
              </button>
              <button className="btn-secondary" onClick={addWords}>加入自定义词库</button>
            </div>
          </div>

          <div className="panel p-5">
            <h3 className="text-xl font-bold">情景词汇</h3>
            <div className="mt-4 grid gap-3">
              {currentScene.words?.map((word) => (
                <article key={word.word} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="flex justify-between gap-3">
                    <strong>{word.word}</strong>
                    <span className="text-sm text-slate-500">{word.meaning}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{word.example}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{word.exampleCn}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {scenes.length ? (
        <section className="mt-6">
          <h2 className="text-xl font-bold">已保存情景</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {scenes.slice(-6).reverse().map((scene) => (
              <button key={scene.id} className="panel p-4 text-left hover:border-blue-300" onClick={() => setCurrentScene(scene)}>
                <strong>{scene.title}</strong>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{scene.description}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

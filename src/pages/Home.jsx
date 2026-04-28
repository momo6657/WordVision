import { Brain, CheckCircle2, Image, ListChecks } from "lucide-react";

const features = [
  { label: "AI 图片联想", icon: Image },
  { label: "四选一测试", icon: CheckCircle2 },
  { label: "进度记录", icon: ListChecks },
  { label: "错题复习", icon: Brain },
];

export default function Home({ onStart, onDocs }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-16">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">AI Visual Vocabulary</p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 dark:text-white sm:text-5xl">WordVision</h1>
        <p className="mt-4 text-2xl font-bold text-slate-700 dark:text-slate-200">AI 视觉词汇学习助手</p>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          通过 AI 图片联想、四选一测试和学习进度记录，帮助你更高效地记忆英语单词。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="btn-primary px-6 py-3 text-base" onClick={onStart}>
            开始学习
          </button>
          <button className="btn-secondary px-6 py-3 text-base" onClick={onDocs}>
            查看项目说明
          </button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 p-6 text-white">
          <div className="rounded-lg bg-white/15 p-5 backdrop-blur">
            <p className="text-sm opacity-90">Today's word</p>
            <p className="mt-2 text-4xl font-black">abandon</p>
            <p className="mt-1 text-white/85">/a'baendan/</p>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.label} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <Icon className="text-blue-600 dark:text-blue-300" size={22} />
                <p className="mt-3 font-bold">{feature.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

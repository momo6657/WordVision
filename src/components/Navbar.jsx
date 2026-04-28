import { BarChart3, BookOpen, Home, ListX, Moon, Sun } from "lucide-react";

const navItems = [
  { view: "home", label: "首页", icon: Home },
  { view: "books", label: "词库", icon: BookOpen },
  { view: "mistakes", label: "错题本", icon: ListX },
  { view: "statistics", label: "统计", icon: BarChart3 },
];

export default function Navbar({ currentView, onNavigate, theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <button className="flex items-center gap-2 text-left" onClick={() => onNavigate("home")}>
          <span className="grid h-9 w-9 place-items-center rounded-md bg-blue-600 text-sm font-black text-white">W</span>
          <span>
            <span className="block text-base font-bold leading-tight">WordVision</span>
            <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">AI 视觉词汇学习助手</span>
          </span>
        </button>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
                onClick={() => onNavigate(item.view)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            onClick={onToggleTheme}
            title="切换深色模式"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </nav>
      </div>
    </header>
  );
}

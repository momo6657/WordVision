export default function OptionButton({ option, selected, answered, onSelect }) {
  const stateClass =
    answered && option.isCorrect
      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100"
      : answered && selected
        ? "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-100"
        : "border-slate-200 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-blue-950/40";

  return (
    <button
      disabled={answered}
      className={`min-h-14 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${stateClass}`}
      onClick={onSelect}
    >
      {option.label}
    </button>
  );
}

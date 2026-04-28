export default function ProgressBar({ value, label }) {
  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</div> : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

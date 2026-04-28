export default function StatCard({ label, value, tone = "blue" }) {
  const tones = {
    blue: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-200",
    green: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-200",
    orange: "text-orange-700 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-200",
    slate: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200",
    red: "text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-200",
  };

  return (
    <div className={`rounded-lg p-4 ${tones[tone]}`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

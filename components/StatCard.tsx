type Props = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
};

const TONE_CLASSES: Record<string, string> = {
  default: "text-ardoise-900",
  warning: "text-amber-700",
  danger: "text-red-800",
  success: "text-faraday-700",
};

export default function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className="card">
      <p className="text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">{label}</p>
      <p className={`mt-3 font-serif text-4xl font-medium ${TONE_CLASSES[tone]}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-ardoise-400">{hint}</p>}
    </div>
  );
}

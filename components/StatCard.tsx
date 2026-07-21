type Props = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
};

const TONE_CLASSES: Record<string, string> = {
  default: "text-ardoise-900",
  warning: "text-amber-600",
  danger: "text-red-600",
  success: "text-faraday-700",
};

export default function StatCard({ label, value, hint, tone = "default" }: Props) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-ardoise-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${TONE_CLASSES[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ardoise-400">{hint}</p>}
    </div>
  );
}

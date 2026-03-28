"use client";

type BreakdownRowProps = {
  label: string;
  value: number;
  suffix?: string;
};

export default function BreakdownRow({
  label,
  value,
  suffix = "kcal",
}: BreakdownRowProps) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm font-body text-slate-300">{label}</span>
      <span className="text-sm">
        {Math.round(value).toLocaleString()} {suffix}
      </span>
    </div>
  );
}

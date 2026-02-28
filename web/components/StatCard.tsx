type StatCardProps = {
  label: string;
  sublabel?: string;
  value: string;
};

export function StatCard({ label, sublabel, value }: StatCardProps) {
  return (
    <div className="flex-1 min-w-[30%] flex flex-col items-center justify-between gap-1 border border-blue-500 py-3 px-2 rounded-lg bg-slate-950/50">
      <div className="flex items-center justify-center gap-1">
        <span className="text-gray-300 text-sm truncate">{label}</span>
        {sublabel && <span className="text-gray-500 text-xs">{sublabel}</span>}
      </div>
      <span className="text-gray-100 text-base text-center">{value}</span>
    </div>
  );
}

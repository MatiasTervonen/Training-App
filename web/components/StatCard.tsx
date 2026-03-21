type StatCardProps = {
  label: string;
  sublabel?: string;
  value: string;
};

export function StatCard({ label, sublabel, value }: StatCardProps) {
  return (
    <div className="flex-1 min-w-[30%] flex flex-col items-center justify-between gap-1 py-3 px-2 rounded-lg bg-white/5">
      <div className="flex items-center justify-center gap-1">
        <span className="text-gray-400 text-sm font-body truncate">{label}</span>
        {sublabel && <span className="text-gray-500 text-xs font-body">{sublabel}</span>}
      </div>
      <span className="text-gray-100 text-base text-center">{value}</span>
    </div>
  );
}

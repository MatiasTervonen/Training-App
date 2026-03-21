import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center mt-[15%] px-8">
      <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
        <Icon size={36} className="text-slate-400" />
      </div>
      <p className="text-xl text-center mb-3">{title}</p>
      {description && (
        <p className="font-body text-sm text-gray-400 text-center">
          {description}
        </p>
      )}
    </div>
  );
}

import { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
  border: string;
}

export default function FeatureGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <div
            key={f.title}
            className={`bg-slate-900/50 rounded-xl p-6 border ${f.border} hover:bg-slate-800/50 transition-colors duration-300`}
          >
            <Icon className={`${f.color} mb-3`} size={28} />
            <h3 className="text-lg mb-2">{f.title}</h3>
            <p className="font-[family-name:var(--font-body)] text-gray-400 text-sm">
              {f.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}

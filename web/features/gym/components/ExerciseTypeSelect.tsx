import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  label?: string;
  onChange: (value: string) => void;
  options: Option[];
};

export default function ExerciseTypeSelect({
  value,
  label,
  options,
  onChange,
}: SelectProps) {
  return (
    <div>
      {label && <label className="text-gray-300 block mb-1">{label}</label>}
      <div className="relative">
        <select
          className="appearance-none p-2 pr-10 rounded-md border-2 border-gray-100 z-10 w-full bg-slate-900  placeholder-gray-500 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option className="w-full flex" key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none ">
          <ChevronDown className="text-gray-100" />
        </div>
      </div>
    </div>
  );
}

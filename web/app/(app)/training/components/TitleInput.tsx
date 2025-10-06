type TitleInputProps = {
  title: string;
  setTitle: (value: string) => void;
  placeholder: string;
  label?: string;
  id?: string;
  maxLength?: number;
  type?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  className?: string;
};

export default function TitleInput({
  title,
  setTitle,
  placeholder,
  label,
  id = "title-input",
  maxLength,
  type = "text",
  disabled = false,
  name,
  required = false,
  className,
}: TitleInputProps) {
  return (
    <div className="flex flex-col ">
      <label htmlFor={id} className="text-gray-300 mb-1 text-sm">
        {label}
      </label>
      <input
        id={id}
        className={`text-lg p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  text-gray-100 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300 ${className}`}
        type={type}
        spellCheck={false}
        placeholder={placeholder}
        value={title}
        autoComplete={type === "email" ? "email" : "off"}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        name={name}
        required={required}
      />
    </div>
  );
}

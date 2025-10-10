type CustomInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  setValue?: (value: string) => void;
  label?: string;
};

export default function CustomInput({
  value,
  setValue,
  label,
  id,
  className,
  ...props
}: CustomInputProps) {
  return (
    <div className="flex flex-col ">
      {label && (
        <label htmlFor={id} className="text-gray-300 mb-1 text-sm">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`p-2 rounded-md border-2 border-gray-100 z-10 placeholder-gray-500  text-gray-100 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300 ${className}`}
        onChange={(e) => setValue && setValue(e.target.value)}
        value={value}
        {...props}
      />
    </div>
  );
}

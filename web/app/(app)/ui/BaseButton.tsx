type BaseButtonProps = {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export default function BaseButton({
  onClick,
  label = "Save",
  disabled,
  className,
}: BaseButtonProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200 ${className}`}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

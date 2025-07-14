export default function Spinner({ size = "w-5 h-5", className = "" }: { size?: string, className?: string }) {
  return (
    <>
      <div
        className={`border-[3px] rounded-full border-blue-500 border-t-transparent animate-spin ${size} ${className}`}
      />
    </>
  );
}

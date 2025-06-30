export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <>
      <div
        className={`w-[20px] h-[20px] border-[3px] rounded-full border-blue-500 border-t-transparent animate-spin`}
        style={{ width: size, height: size }}
      />
    </>
  );
}

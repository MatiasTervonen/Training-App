"use client";

export default function Toggle({
  isOn,
  onToggle,
}: {
  isOn: boolean;
  onToggle: () => void;
}) {
  
  function handleToggle() {
    onToggle();
  }

  return (
    <>
      <button
        className={`rounded-full border w-12 h-6 transition-colors ${
          isOn ? "bg-green-600" : "bg-gray-400"
        } p-0.5 flex items-center`}
        onClick={handleToggle}
      >
        <div
          className={`w-5 h-5 rounded-full transition-transform transform ${
            isOn ? "translate-x-6 bg-slate-900" : "bg-slate-900 translate-x-0"
          }`}
        ></div>
      </button>
    </>
  );
}

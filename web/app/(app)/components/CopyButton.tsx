"use client";

import toast from "react-hot-toast";

export default function CopyButton({ targetId }: { targetId: string }) {
  const handleCopy = async () => {
    const element = document.getElementById(targetId);

    if (!element) {
      alert("Element not found.");
      return;
    }

    try {
      await navigator.clipboard.writeText(element.innerText);
      toast.success("Notes copied to clipboard!");
    } catch {
      toast.error("Failed to copy notes.");
    }
  };

  return (
    <button
      aria-label="Copy Notes"
      onClick={handleCopy}
      className="mt-10 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 hover:scale-105 transition-all duration-200 cursor-pointer"
    >
      Copy Notes
    </button>
  );
}

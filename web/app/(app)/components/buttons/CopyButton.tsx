"use client";

import toast from "react-hot-toast";

export default function CopyButton({
  targetId,
  label = "Copy Notes",
}: {
  targetId: string;
  label?: string;
}) {
  const handleCopy = async () => {
    const element = document.getElementById(targetId);

    if (!element) {
      alert("Element not found.");
      return;
    }

    try {
      await navigator.clipboard.writeText(element.innerText);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy notes.");
    }
  };

  return (
    <button
      aria-label="Copy Notes"
      onClick={handleCopy}
      className="mt-10 px-4 py-2 bg-blue-800 border-2 border-blue-500 rounded hover:bg-blue-700 hover:scale-105 transition-all duration-200 cursor-pointer"
    >
      {label}
    </button>
  );
}

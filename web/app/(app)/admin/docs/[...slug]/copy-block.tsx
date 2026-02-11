"use client";

import { Copy } from "lucide-react";
import toast from "react-hot-toast";

export function CopyBlock({ children }: { children: string }) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    toast.success("Copied to clipboard");
  };

  return (
    <pre className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded hover:scale-105 transition-all duration-200 cursor-pointer "
      >
        <Copy />
      </button>
      <code className="select-all">{children}</code>
    </pre>
  );
}

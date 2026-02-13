"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ targetId }: { targetId: string }) {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const element = document.getElementById(targetId);

    if (!element) {
      alert(t("common.elementNotFound"));
      return;
    }

    try {
      await navigator.clipboard.writeText(element.innerText);
      toast.success(t("common.copiedToClipboard"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.failedToCopy"));
    }
  };

  return (
    <button
      aria-label={t("common.copyNotes")}
      onClick={handleCopy}
      className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
    >
      {copied ? <Check size={18} /> : <Copy size={18} />}
    </button>
  );
}

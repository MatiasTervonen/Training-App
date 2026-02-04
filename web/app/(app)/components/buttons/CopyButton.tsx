"use client";

import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function CopyButton({
  targetId,
  label,
}: {
  targetId: string;
  label?: string;
}) {
  const { t } = useTranslation("common");
  const buttonLabel = label ?? t("common.copyNotes");

  const handleCopy = async () => {
    const element = document.getElementById(targetId);

    if (!element) {
      alert(t("common.elementNotFound"));
      return;
    }

    try {
      await navigator.clipboard.writeText(element.innerText);
      toast.success(t("common.copiedToClipboard"));
    } catch {
      toast.error(t("common.failedToCopy"));
    }
  };

  return (
    <button
      aria-label={buttonLabel}
      onClick={handleCopy}
      className="mt-10 px-4 py-2 bg-blue-800 border-2 border-blue-500 rounded hover:bg-blue-700 hover:scale-105 transition-all duration-200 cursor-pointer"
    >
      {buttonLabel}
    </button>
  );
}

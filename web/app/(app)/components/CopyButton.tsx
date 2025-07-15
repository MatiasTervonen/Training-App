"use client";

export default function CopyButton({ targetId }: { targetId: string }) {
  const handleCopy = () => {
    const element = document.getElementById(targetId);

    if (!element) {
      alert("Element not found.");
      return;
    }

    const text = element.innerText;

    if ("clipboard" in navigator) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          alert("Text copied to clipboard!");
        })
        .catch((error) => {
          console.error("Failed to copy text: ", error);
          alert("Failed to copy text.");
        });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        alert("Text copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy text: ", error);
        alert("Failed to copy text.");
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <button
      aria-label="Copy Notes"
      onClick={handleCopy}
      className="mt-10 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Copy Notes
    </button>
  );
}

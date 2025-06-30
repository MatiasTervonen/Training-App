"use client";

import { useState, useRef } from "react";
import { useClickOutside } from "../(app)/components/clickOutside";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string; platform: string }>;
}

interface InstallAppProps {
  deferredPrompt: BeforeInstallPromptEvent | null;
  showIosPrompt: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
}

export default function InstallApp({
  deferredPrompt,
  showIosPrompt,
  setDeferredPrompt,
}: InstallAppProps) {
  const [expanded, setExpanded] = useState(false);

  const installRef = useRef<HTMLDivElement>(null);

  useClickOutside(installRef, () => setExpanded(false));

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {deferredPrompt && (
        <button
          className=" bg-slate-700 py-2 px-4 rounded-xl border-2 border-slate-300 hover:bg-slate-600 hover:scale-95 cursor-pointer"
          onClick={handleInstallClick}
        >
          <div className="flex gap-2 items-center">
            <p>Download app</p>
          </div>
        </button>
      )}

      {showIosPrompt && (
        <div ref={installRef} className="relative inline-block">
          <button
            className=" bg-slate-700 py-2 px-4 rounded-xl border-2 border-slate-300 hover:bg-slate-600 hover:scale-95 cursor-pointer"
            onClick={() => setExpanded((prev) => !prev)}
          >
            <div className="flex gap-2 items-center">
              <p>Download app</p>
            </div>
          </button>
          {expanded && (
            <div
              onClick={() => setExpanded(false)}
              className="absolute left-1/2 -translate-x-1/2 bg-slate-800 p-4 rounded-lg mt-2 w-max shadow-lg"
            >
              <p className="text-gray-300 mb-2">
                Tap the <span className="">Share</span> button in Safari, then
                choose
              </p>
              <span className="text-gray-400">
                &quot;Add to Home Screen&quot;
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

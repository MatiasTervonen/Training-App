"use client";

import ModalPageWrapper from "../components/modalPageWrapper";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ModalPageWrapper>
      <div className="flex flex-col items-center justify-center gap-5 max-w-3xl mx-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-xl px-5 pt-20 text-gray-100">
        <h2>Unable to load feed</h2>
        <p>{error.message}</p>
        <button
          className="flex items-center justify-center px-10 gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
          onClick={() => reset()}
        >
          Try again
        </button>
      </div>
    </ModalPageWrapper>
  );
}

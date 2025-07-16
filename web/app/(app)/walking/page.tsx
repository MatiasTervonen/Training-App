"use client";

import ModalPageWrapper from "../components/modalPageWrapper";

export default function Walking() {
  return (
    <ModalPageWrapper noTopPadding>
      <div className="bg-slate-800 p-5 min-h-(calc(100dvh-72px) relative">
        <h1
          className="text-gray-100 flex justify-center my-5 text-2xl "
        >
          Walking
        </h1>
        <div className="flex flex-col max-w-md mx-auto">
          <p className="text-gray-300 text-center">
            This page is under construction. Please check back later.
          </p>
        </div>
      </div>
    </ModalPageWrapper>
  );
}

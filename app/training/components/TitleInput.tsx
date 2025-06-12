"use client";

import { russoOne } from "@/app/ui/fonts";

type TitleInputProps = {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  placeholder: string;
};

export default function TitleInput({
  title,
  setTitle,
  placeholder,
}: TitleInputProps) {
  return (
    <div className="flex flex-col ">
      <label className={`${russoOne.className} text-gray-300 mb-1`}>
        Title...
      </label>
      <input
        className="text-lg p-2 rounded-md border-2 border-gray-100 z-10  placeholder-gray-500  text-gray-100 bg-gray-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
        type="text"
        spellCheck={false}
        placeholder={placeholder}
        value={title}
        autoComplete="off"
        onChange={(e) => setTitle(e.target.value)}
      />
    </div>
  );
}

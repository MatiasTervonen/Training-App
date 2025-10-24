import React from "react";

type SetInputProps = {
  placeholder: string;
  value: string | number;
  type: string;
  onChange: (value: string) => void;
  label?: string; // Optional label prop
};

export default function SetInput({
  placeholder,
  value,
  type,
  onChange,
  label = "",
}: SetInputProps) {
  return (
    <>
      <label>{label}</label>
      <input
        className="text-lg  p-2 rounded-md border-2 border-gray-100 z-10 w-full  placeholder-gray-500 text-gray-100 bg-[linear-gradient(50deg,_#0f172a,_#1e293b,_#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
}

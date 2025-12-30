import React from "react";

type SetInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  placeholder: string;
  value: string | number;
  type: string;
  label?: string;
};

export default function SetInput({
  placeholder,
  value,
  type,
  label = "",
  ...props
}: SetInputProps) {
  return (
    <>
      <label>{label}</label>
      <input
        className="text-lg  p-2 rounded-md border-2 border-gray-100 z-10 w-full  placeholder-gray-500 text-gray-100 bg-[linear-gradient(50deg,#0f172a,#1e293b,#333333)] hover:border-blue-500 focus:outline-none focus:border-green-300"
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        autoComplete="off"
        spellCheck={false}
        {...props}
      />
    </>
  );
}

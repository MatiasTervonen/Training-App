import React, { useRef, useState } from "react";
import { useClickOutside } from "@/app/components/clickOutside";

type DropdownMenuProps = {
  button: React.ReactNode;
  children: React.ReactNode;
};

export default function DropdownMenu({ button, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen((prev) => !prev)}>{button}</button>

      {open && (
        <div
          className="absolute right-0  top-full flex flex-col border-2 px-4 py-2 text-gray-100 mt-2 shadow-lg rounded-md  z-50 bg-gray-700"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

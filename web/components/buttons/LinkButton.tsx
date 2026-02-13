"use client";

import Link from "next/link";
import { useTransitionDirectionStore } from "@/lib/stores/transitionDirection";

interface LinkButtonProps {
  href: string;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export default function LinkButton({
  href,
  children,
  onClick,
}: LinkButtonProps) {
  const { setDirection } = useTransitionDirectionStore();

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        setDirection(0);
      }}
      className="flex items-center justify-center gap-2 bg-blue-800 py-2 w-full rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all duration-200"
    >
      {children}
    </Link>
  );
}

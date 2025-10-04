"use client";

import Link from "next/link";
import { useTransitionDirectionStore } from "@/app/(app)/lib/stores/transitionDirection";

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function LinkButton({ href, children }: LinkButtonProps) {
  const { setDirection } = useTransitionDirectionStore();

  return (
    <Link
      href={href}
      onClick={() => setDirection(0)}
      className="flex items-center justify-center gap-2 bg-blue-800 py-2 w-full rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105"
    >
      {children}
    </Link>
  );
}

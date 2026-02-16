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
      className="btn-base flex items-center gap-2 justify-center"
    >
      {children}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FooterMobile() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null; // Don't render the footer on the homepage
  }

  return (
    <div className="w-full flex flex-col py-4  bg-slate-900">
      <Link
        href="/"
        className="border-2 border-gray-100 bg-blue-950 w-fit p-2 ml-20 rounded-md "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6 text-gray-100"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
      </Link>
    </div>
  );
}

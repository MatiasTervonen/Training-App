"use client";

import { usePathname } from "next/navigation";
import Navbar from "./homepage/navbar";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const noNavbarPaths = ["/login"];

  const showNavbar = !noNavbarPaths.includes(pathname);

  return (
    <>
      {showNavbar && (
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>
      )}

      <main className={showNavbar ? "pt-[72]" : ""}>{children}</main>
    </>
  );
}

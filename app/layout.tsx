import type { Metadata } from "next";

import "./globals.css";
import Navbar from "./ui/homepage/navbar";
import LayoutWrapper from "./ui/LayoutWrapper";
import { russoOne } from "@/app/ui/fonts";

export const metadata: Metadata = {
  title: "Training",
  description: "Track your training progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}

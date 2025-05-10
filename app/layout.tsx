import type { Metadata } from "next";

import "./globals.css";
import Navbar from "./ui/homepage/navbar";

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
        <div className="sticky top-0 z-50">
          <Navbar />
        </div>
        {children}
      </body>
    </html>
  );
}

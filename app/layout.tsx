import type { Metadata } from "next";

import "./globals.css";
import Navbar from "./ui/homepage/navbar";
import LayoutWrapper from "./ui/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import { UserEmailProvider } from "@/utils/supabase/UserEmail";

export const metadata: Metadata = {
  title: "MyTrack",
  description:
    "Track everything from gym workouts to Disc Golf rounds and personal goals. MyTrack helps you stay organized and motivated—your progress, your way.",
  metadataBase: new URL("https://training-app-bay.vercel.app/"),
  openGraph: {
    title: "MyTrack",
    description:
      "Track everything from gym workouts to Disc Golf rounds and personal goals. MyTrack helps you stay organized and motivated—your progress, your way.",
    url: "https://training-app-bay.vercel.app/",
    siteName: "MyTrack",
    // images: [
    //   {
    //     url: "/opengraph-image.png",
    //     width: 1200,
    //     height: 630,
    //     alt: "Weather App",
    //   },
    // ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="md:max-w-3xl mx-auto bg-slate-900">
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>

        <Toaster position="top-center" reverseOrder={false} />

        <LayoutWrapper>
          <UserEmailProvider>
            {/* This context provider can be used to access the user's email in any component */}
            {children}
          </UserEmailProvider>
        </LayoutWrapper>
      </body>
    </html>
  );
}

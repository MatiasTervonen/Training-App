import type { Metadata } from "next";

import "./globals.css";
import Navbar from "./ui/homepage/navbar";
import LayoutWrapper from "./ui/LayoutWrapper";

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
      <body>
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar />
        </div>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}

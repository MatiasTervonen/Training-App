import type { Metadata } from "next";
import "./globals.css";
import { russoOne, lexend } from "./ui/fonts";
import Provider from "./components/provider";

export const metadata: Metadata = {
  title: {
    template: "%s | MyTrack",
    default: "MyTrack",
  },
  description:
    "Track everything from gym workouts to Disc Golf rounds and personal goals. MyTrack helps you stay organized and motivated—your progress, your way.",
  metadataBase: new URL("https://training-app-bay.vercel.app/"),
  openGraph: {
    title: "MyTrack",
    description:
      "Track everything from gym workouts to Disc Golf rounds and personal goals. MyTrack helps you stay organized and motivated—your progress, your way.",
    url: "https://training-app-bay.vercel.app/",
    siteName: "MyTrack",
    images: [
      {
        url: "https://training-app-bay.vercel.app/opengraph-desktop.png",
        width: 1200,
        height: 630,
        alt: "Home OG Image",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${russoOne.className} ${lexend.variable} antialiased`}
    >
      <body className="bg-gray-950 text-gray-100">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

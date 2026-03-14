import type { Metadata } from "next";
import "./globals.css";
import { russoOne, lexend } from "./ui/fonts";
import Provider from "./components/provider";
import { APP_NAME } from "@/lib/app-config";

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.ico", sizes: "48x48" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  description:
    `Track everything from gym workouts to Disc Golf rounds and personal goals. ${APP_NAME} helps you stay organized and motivated—your progress, your way.`,
  metadataBase: new URL("https://training-app-bay.vercel.app/"),
  openGraph: {
    title: APP_NAME,
    description:
      `Track everything from gym workouts to Disc Golf rounds and personal goals. ${APP_NAME} helps you stay organized and motivated—your progress, your way.`,
    url: "https://training-app-bay.vercel.app/",
    siteName: APP_NAME,
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
      className={`${russoOne.className} ${russoOne.variable} ${lexend.variable} antialiased`}
    >
      <body className="bg-gray-950 text-gray-100">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

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
    `Gym workouts, outdoor activities, habits, notes, to-dos, and more. ${APP_NAME} keeps everything organized in one place — your life, your way.`,
  metadataBase: new URL("https://kurvi.io/"),
  openGraph: {
    title: APP_NAME,
    description:
      `Gym workouts, outdoor activities, habits, notes, to-dos, and more. ${APP_NAME} keeps everything organized in one place — your life, your way.`,
    url: "https://kurvi.io/",
    siteName: APP_NAME,
    images: [
      {
        url: "https://kurvi.io/Hero-image-3.png",
        width: 1218,
        height: 927,
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

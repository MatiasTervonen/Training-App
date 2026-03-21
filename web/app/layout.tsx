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
    `The only tracking app you'll ever need. Gym, activities, habits, notes, to-dos, and more — all in one place. ${APP_NAME} keeps everything organized, your way.`,
  metadataBase: new URL("https://training-app-bay.vercel.app/"),
  openGraph: {
    title: APP_NAME,
    description:
      `The only tracking app you'll ever need. Gym, activities, habits, notes, to-dos, and more — all in one place. ${APP_NAME} keeps everything organized, your way.`,
    url: "https://training-app-bay.vercel.app/",
    siteName: APP_NAME,
    images: [
      {
        url: "https://training-app-bay.vercel.app/Hero-image-3.png",
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

import { Lexend, Russo_One } from "next/font/google";

export const russoOne = Russo_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-primary",
});

export const lexend = Lexend({
  subsets: ["latin"],
  weight: "500", 
  display: "swap",
  variable: "--font-body",
});

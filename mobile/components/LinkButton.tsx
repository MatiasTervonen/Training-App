import { Link } from "expo-router";
import { Pressable } from "react-native";
import AppText from "./AppText";

import type { LinkProps } from "expo-router";

interface LinkButtonProps {
  href: LinkProps["href"];
  label?: string;
  children?: React.ReactNode;
}

export default function LinkButton({ href, label, children }: LinkButtonProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        android_ripple={{ color: "#666" }}
        className="flex-row items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-md border-2 border-blue-500 text-gray-100 text-lg"
      >
        {label && <AppText className="text-lg">{label}</AppText>}
        {children}
      </Pressable>
    </Link>
  );
}

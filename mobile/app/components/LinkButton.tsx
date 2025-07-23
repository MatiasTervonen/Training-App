import { Link } from "expo-router";
import { Pressable } from "react-native";

import type { LinkProps } from "expo-router";

interface LinkButtonProps {
  href: LinkProps["href"];
  children: React.ReactNode;
}

export default function LinkButton({ href, children }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className="flex-row items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-md border-2 border-blue-500 text-gray-100 text-lg"
      asChild
    >
      <Pressable>{children}</Pressable>
    </Link>
  );
}

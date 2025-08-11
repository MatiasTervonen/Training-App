import { Text, TextProps } from "react-native";

export default function AppText({
  className,
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      className={`font-russo text-gray-100 ${className ?? ""}`}
      {...props}
    />
  );
}

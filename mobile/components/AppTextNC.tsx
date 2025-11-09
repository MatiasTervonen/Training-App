import { Text, TextProps } from "react-native";

export default function AppTextNC({
  className,
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text className={`font-russo ${className}`} {...props} />
  );
}
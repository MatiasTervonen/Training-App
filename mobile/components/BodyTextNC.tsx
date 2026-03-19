import { Text, TextProps } from "react-native";

export default function BodyTextNC({
  className = "",
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      maxFontSizeMultiplier={1.2}
      className={`font-lexend text-[14.5px] leading-[24px] ${className}`}
      {...props}
    />
  );
}

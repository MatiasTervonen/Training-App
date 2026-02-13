import { Text, TextProps } from "react-native";

export default function BodyText({
  className,
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      maxFontSizeMultiplier={1.2}
      className={`font-lexend text-gray-200 text-[14.5px] leading-[24px]  ${className ?? ""}`}
      {...props}
    />
  );
}

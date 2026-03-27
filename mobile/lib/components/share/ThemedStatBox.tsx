import { View } from "react-native";
import AppText from "@/components/AppText";
import { ShareCardTheme } from "@/lib/share/themes";

type ThemedStatBoxProps = {
  label: string;
  value: string;
  theme: ShareCardTheme;
  size?: "small" | "normal" | "large";
};

export default function ThemedStatBox({
  label,
  value,
  theme,
  size = "normal",
}: ThemedStatBoxProps) {
  const { colors } = theme;
  const fontSize = size === "large" ? 52 : size === "small" ? 26 : 36;
  const labelSize = size === "large" ? 32 : size === "small" ? 18 : 24;
  const py = size === "large" ? 40 : size === "small" ? 18 : 30;

  return (
    <View
      className="items-center justify-center gap-2 border rounded-lg px-[20px]"
      style={{
        borderColor: colors.statBoxBorder,
        backgroundColor: colors.statBoxBg,
        paddingVertical: py,
      }}
    >
      <AppText
        style={{ fontSize: labelSize, color: colors.textSecondary }}
      >
        {label}
      </AppText>
      <AppText
        style={{ fontSize, color: colors.textPrimary }}
      >
        {value}
      </AppText>
    </View>
  );
}

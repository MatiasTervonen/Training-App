import { View } from "react-native";
import AppText from "@/components/AppText";
import { ShareCardTheme } from "@/lib/share/themes";

type ThemedStatBoxProps = {
  label: string;
  value: string;
  theme: ShareCardTheme;
  size?: "normal" | "large";
};

export default function ThemedStatBox({
  label,
  value,
  theme,
  size = "normal",
}: ThemedStatBoxProps) {
  const { colors } = theme;
  const isLarge = size === "large";

  return (
    <View
      className="items-center justify-center gap-2 border rounded-lg px-[20px]"
      style={{
        borderColor: colors.statBoxBorder,
        backgroundColor: colors.statBoxBg,
        paddingVertical: isLarge ? 40 : 30,
      }}
    >
      <AppText
        style={{ fontSize: isLarge ? 32 : 24, color: colors.textSecondary }}
      >
        {label}
      </AppText>
      <AppText
        style={{ fontSize: isLarge ? 52 : 36, color: colors.textPrimary }}
      >
        {value}
      </AppText>
    </View>
  );
}

import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/AppText";
import { ReactNode } from "react";

type GradientColorTextProps = {
  children: ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: object;
};

export default function GradientColorText({
  children,
  colors,
  style,
}: GradientColorTextProps) {
  return (
    <MaskedView
      maskElement={
        <AppText
          className="text-4xl text-center"
          style={{ backgroundColor: "transparent" }}
        >
          {children}
        </AppText>
      }
      style={style} // Set width & height for mask container
    >
      <LinearGradient
        colors={colors || ["#2BC0E4", "#EAECC6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </MaskedView>
  );
}

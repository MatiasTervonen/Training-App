import { forwardRef } from "react";
import { View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ShareCardTheme,
  ShareCardSize,
  SHARE_CARD_DIMENSIONS,
} from "@/lib/share/themes";

type ThemedCardWrapperProps = {
  theme: ShareCardTheme;
  size: ShareCardSize;
  children: React.ReactNode;
  className?: string;
  contentStyle?: ViewStyle;
};

const ThemedCardWrapper = forwardRef<View, ThemedCardWrapperProps>(
  ({ theme, size, children, className = "flex-1 justify-between", contentStyle }, ref) => {
    const dims = SHARE_CARD_DIMENSIONS[size];
    const { colors } = theme;
    const isGradient = colors.background.length > 1;
    const defaultContentStyle = { padding: 60, ...contentStyle };

    return (
      <View
        ref={ref}
        collapsable={false}
        style={{ width: dims.width, height: dims.height }}
      >
        {isGradient ? (
          <LinearGradient
            colors={colors.background as [string, string, ...string[]]}
            start={colors.gradientStart ?? { x: 0.5, y: 0 }}
            end={colors.gradientEnd ?? { x: 0.5, y: 1 }}
            className={className}
            style={defaultContentStyle}
          >
            {children}
          </LinearGradient>
        ) : (
          <View
            className={className}
            style={{ backgroundColor: colors.background[0], ...defaultContentStyle }}
          >
            {children}
          </View>
        )}
      </View>
    );
  },
);

ThemedCardWrapper.displayName = "ThemedCardWrapper";

export default ThemedCardWrapper;

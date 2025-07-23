// components/Skeleton.tsx
import { View } from "react-native";

export default function Skeleton({
  size = 40,
  style,
}: {
  size?: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          flex: 1,
          borderRadius: size / 2,
          backgroundColor: "#ccc",
        },
        style,
      ]}
    />
  );
}

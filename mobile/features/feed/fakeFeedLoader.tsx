import { View } from "react-native";
import { Image } from "expo-image";

export default function FakeFeedLoader() {
  return (
    <View
      className="absolute inset-0 z-50 items-center justify-center"
      style={{ backgroundColor: "#0f172a" }}
    >
      <Image
        source={require("@/assets/images/app-logos/kurvi_ice_blue_final_copnverted.png")}
        style={{ width: 150, height: 150 }}
        contentFit="contain"
      />
    </View>
  );
}

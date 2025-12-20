import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import useScreenOrientation from "@/hooks/layout/useScreenOrientation";
import Navbar from "../navbar/Navbar";

export default function SaveAreaInset({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  // useScreenOrientation hook to get screen orientation and hide navbar on timer page when in landscape mode
  const { hideNawbar } = useScreenOrientation();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
      className={`flex-1  bg-slate-900 font-russo  ${
        hideNawbar ? "max-w-screen" : "max-w-3xl"
      }`}
    >
      {!hideNawbar && <Navbar />}
      {children}
    </View>
  );
}

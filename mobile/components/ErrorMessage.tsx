import { View } from "react-native";
import AppText from "@/components/AppText";
import { AlertTriangle } from "lucide-react-native";

type Props = {
  message: string;
  fullPage?: boolean;
};

export default function ErrorMessage({ message, fullPage }: Props) {
  const box = (
    <View className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex-row items-center gap-3">
      <AlertTriangle size={18} color="#ef4444" />
      <AppText className="text-sm text-red-400 flex-1">{message}</AppText>
    </View>
  );

  if (fullPage) {
    return <View className="mt-[25%] px-6">{box}</View>;
  }

  return box;
}

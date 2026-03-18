import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";

type Props = {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
};

export default function FloatingActionButton({ onPress, children, disabled }: Props) {
  return (
    <View className="absolute bottom-8 right-6 z-50">
      <View className="absolute -inset-0.5 rounded-full bg-cyan-400/20" />
      <View className="absolute -inset-2 rounded-full bg-cyan-400/10" />
      <View className="absolute -inset-3.5 rounded-full bg-cyan-400/5" />
      <AnimatedButton
        onPress={onPress}
        className="w-14 h-14 rounded-full items-center justify-center shadow-xl bg-slate-800 border-[1.5px] border-cyan-400/60 shadow-cyan-400/60"
        disabled={disabled}
      >
        {children}
      </AnimatedButton>
    </View>
  );
}

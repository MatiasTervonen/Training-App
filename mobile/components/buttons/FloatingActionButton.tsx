import { View } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";

type Props = {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  color?: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function FloatingActionButton({ onPress, children, disabled, color = "#06b6d4" }: Props) {
  return (
    <View className="absolute bottom-8 right-6 z-50">
      <View className="absolute -inset-0.5 rounded-full" style={{ backgroundColor: hexToRgba(color, 0.2) }} />
      <View className="absolute -inset-2 rounded-full" style={{ backgroundColor: hexToRgba(color, 0.1) }} />
      <View className="absolute -inset-3.5 rounded-full" style={{ backgroundColor: hexToRgba(color, 0.05) }} />
      <AnimatedButton
        onPress={onPress}
        className="w-14 h-14 rounded-full items-center justify-center shadow-xl bg-slate-800 border-[1.5px]"
        style={{ borderColor: hexToRgba(color, 0.6), shadowColor: hexToRgba(color, 0.6) }}
        disabled={disabled}
      >
        {children}
      </AnimatedButton>
    </View>
  );
}

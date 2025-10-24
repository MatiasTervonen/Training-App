import { View } from "react-native";

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
}

export default function Toggle({ isOn, onToggle }: ToggleProps) {
  function handleToggle() {
    onToggle();
  }

  return (
    <View
      className={`rounded-full border-2 border-gray-300 w-[48px] h-[24px] transition-colors p-0.5 flex items-center ${
        isOn ? "bg-green-500" : "bg-slate-600"
      }  justify-center`}
      onTouchEnd={handleToggle}
      hitSlop={10}
    >
      <View
        className={`absolute left-0 w-[20px] h-[20px] bg-slate-900 rounded-full transition-transform transform ${
          isOn ? "translate-x-[24px]" : "translate-x-0"
        }`}
      ></View>
    </View>
  );
}

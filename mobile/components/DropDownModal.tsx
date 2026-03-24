import AppText from "@/components/AppText";
import {
  View,
  Pressable,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useState } from "react";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Menu } from "lucide-react-native";

type SelectInputProps = {
  label?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
};

export default function DropDownModal({
  label,
  options,
  onChange,
  disabled,
  icon,
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePress = () => {
    if (disabled) return; // prevent accidental opens
    setIsOpen(true);
  };

  const rawScreenWidth = Dimensions.get("window").width;
  const screenWidth = Math.min(rawScreenWidth, 768);

  return (
    <View>
      <TouchableOpacity onPressIn={handlePress} hitSlop={12}>
        {icon || <Menu color="#f3f4f6" />}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
        transparent={true}
        animationType="fade"
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => setIsOpen(false)}
        >
          <View
            onStartShouldSetResponder={() => true}
            className="border-[1.5px] border-slate-600 rounded-xl bg-slate-900 py-5 justify-center"
            style={{
              width: screenWidth * 0.85,
              shadowColor: "#3b82f6",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {label && (
              <AppText className="mb-6 text-center text-lg px-4">
                {label}
              </AppText>
            )}
            {options.map((option) => (
              <AnimatedButton
                key={option.value}
                onPress={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
                className="flex-row items-center border py-4 my-2 rounded-xl mx-6 px-4 bg-slate-800 border-slate-700"
              >
                <AppText className="flex-1 text-center">
                  {option.label}
                </AppText>
              </AnimatedButton>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

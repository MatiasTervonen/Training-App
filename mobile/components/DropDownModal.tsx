import AppText from "./AppText";
import { View, Pressable, Modal, TouchableOpacity } from "react-native";
import { useState } from "react";
import AnimatedButton from "./animatedButton";
import { Menu } from "lucide-react-native";

type SelectInputProps = {
  label?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;

  disabled?: boolean;
};

export default function DropDownModal({
  label,
  options,
  onChange,
  disabled,
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePress = () => {
    if (disabled) return; // prevent accidental opens
    setIsOpen(true);
  };

  return (
    <View>
      <TouchableOpacity onPressIn={handlePress} hitSlop={12}>
        <Menu color="#f3f4f6" />
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
          <View className="border-2 border-gray-100 rounded-xl bg-slate-800 w-3/4 py-5">
            {label && (
              <AppText className="mb-6 text-center text-gray-100 text-xl px-4">
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
              >
                <AppText className="text-gray-100  text-center text-2xl border p-4 bg-slate-700 my-2 border-gray-100 rounded-xl mx-6">
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

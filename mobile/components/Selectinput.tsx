import AppText from "./AppText";
import { View, Pressable, Modal } from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

type SelectInputProps = {
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
};

export default function SelectInput({
  label,
  options,
  value,
  onChange,
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedlabel = options.find((option) => option.value === value)?.label;

  return (
    <View>
      <AppText className="mb-2">{label}</AppText>

      <Pressable
        onPressIn={() => setIsOpen(true)}
        className="border-2 border-gray-100 p-2 rounded-md px-4 py-2 h-12 overflow-hidden"
      >
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#333333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0 items-center justify-center"
        >
          <AppText className="text-gray-100 text-lg ">{selectedlabel}</AppText>
        </LinearGradient>
      </Pressable>

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
          <View className="border-2 border-gray-100 rounded-bd bg-slate-800 w-3/4 py-5">
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
              >
                <AppText className="text-gray-100 my-5 text-center text-2xl">
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

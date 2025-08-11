import AppText from "./AppText";
import { View, Pressable, Modal } from "react-native";
import { useState } from "react";

type SelectInputProps = {
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
};

export default function SelectInput({ label, options, value, onChange }: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedlabel = options.find(
    (option) => option.value === value
  )?.label;

  return (
    <View>
      <AppText className="mb-2">{label}</AppText>
      <Pressable
        onPressIn={() => setIsOpen(true)}
        className="border-2 border-gray-100 p-2 rounded-md bg-slate-900"
      >
        <AppText className="text-gray-100">{selectedlabel}</AppText>
      </Pressable>
      <Modal
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
        transparent={true}
        animationType="fade"
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/30"
          onPress={() => setIsOpen(false)}
        >
          <View className="mt-2 border-2 border-gray-100 rounded bg-slate-900 p-2 w-3/4 ">
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange?.(option.value);
                  setIsOpen(false);
                }}
              >
                <AppText className="text-gray-100 my-2 capitalize text-base text-center">
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

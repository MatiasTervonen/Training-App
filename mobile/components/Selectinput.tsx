import AppText from "@/components/AppText";
import { View, Pressable, Modal, ScrollView, Dimensions } from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedButton from "@/components/buttons/animatedButton";

type SelectInputProps = {
  label?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  topLabel?: string;
};

export default function SelectInput({
  label,
  options,
  value,
  onChange,
  disabled,
  topLabel,
  placeholder,
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedlabel = options.find((option) => option.value === value)?.label;

  const handlePress = () => {
    if (disabled) return; // prevent accidental opens
    setIsOpen(true);
  };

  const rawScreenWidth = Dimensions.get("window").width;
  const screenWidth = Math.min(rawScreenWidth, 768);

  return (
    <View>
      {topLabel && <AppText className="mb-1">{topLabel}</AppText>}

      <Pressable
        onPressIn={handlePress}
        className="border-2 border-gray-100 p-2 rounded-md px-4 py-2 h-12 overflow-hidden"
      >
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#333333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0 items-center justify-center"
        >
          <AppText className="text-lg ">{selectedlabel || placeholder}</AppText>
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
          <View
            style={{ maxHeight: "75%", width: screenWidth * 0.85 }}
            className="border-2 border-gray-100 rounded-xl bg-slate-800 py-5 justify-center"
          >
            {label && (
              <AppText className="mb-6 text-center text-xl px-4">
                {label}
              </AppText>
            )}
            <ScrollView>
              {options.map((option) => (
                <AnimatedButton
                  key={option.value}
                  onPress={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                >
                  <AppText className="text-center text-xl border p-2 bg-slate-700 my-2 border-gray-100 rounded-xl mx-6">
                    {option.label}
                  </AppText>
                </AnimatedButton>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

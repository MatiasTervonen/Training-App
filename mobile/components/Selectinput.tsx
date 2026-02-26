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
  selectedDisplay?: string;
};

export default function SelectInput({
  label,
  options,
  value,
  onChange,
  disabled,
  topLabel,
  placeholder,
  selectedDisplay,
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
        className="border-2 border-gray-400 p-2 rounded-md px-4 py-2 h-12 overflow-hidden"
      >
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#333333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0 items-center justify-center"
        >
          <AppText className="text-lg ">
            {selectedDisplay || selectedlabel || placeholder}
          </AppText>
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
            className="border-2 border-slate-300 rounded-xl bg-slate-900 py-5 justify-center"
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
                  className={`flex-row items-center border p-2 my-2 rounded-xl mx-6 px-4 ${option.value === value ? "bg-blue-900/40 border-blue-500" : "bg-slate-800 border-slate-700"}`}
                >
                  <AppText className="text-xl flex-1">{option.label}</AppText>
                  {option.value === value && (
                    <View className="ml-auto">
                      <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                        <AppText className="text-sm">✓</AppText>
                      </View>
                    </View>
                  )}
                </AnimatedButton>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

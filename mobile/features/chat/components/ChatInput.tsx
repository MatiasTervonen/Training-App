import { useState, useCallback } from "react";
import { View, TextInput, Keyboard } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Send } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type ChatInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
};

export default function ChatInput({
  onSend,
  disabled = false,
  disabledMessage,
}: ChatInputProps) {
  const { t } = useTranslation("chat");
  const [text, setText] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }, [text, disabled, onSend]);

  if (disabled && disabledMessage) {
    return (
      <View className="px-4 py-3 border-t border-slate-700 bg-slate-900">
        <View className="bg-slate-800 rounded-xl px-4 py-3">
          <TextInput
            value=""
            placeholder={disabledMessage}
            placeholderTextColor="#64748b"
            editable={false}
            className="text-slate-400 text-base font-lexend"
          />
        </View>
      </View>
    );
  }

  return (
    <View className="px-4 py-2 border-t border-slate-700 bg-slate-900 flex-row items-end gap-2">
      <View className="flex-1 bg-slate-800 rounded-2xl px-4 min-h-[44px] justify-center max-h-[120px]">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("chat.typeMessage")}
          placeholderTextColor="#64748b"
          multiline
          maxLength={2000}
          className="text-slate-100 text-[15px] font-lexend py-2.5"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
      </View>
      <AnimatedButton
        onPress={handleSend}
        className="w-[44px] h-[44px] rounded-full items-center justify-center bg-slate-800 border-2 border-cyan-300"
        disabled={!text.trim()}
      >
        <Send color="#67e8f9" size={20} />
      </AnimatedButton>
    </View>
  );
}

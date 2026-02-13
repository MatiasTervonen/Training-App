import { useState } from "react";
import { Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react-native";

export default function CopyText({ textToCopy }: { textToCopy: string }) {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(textToCopy);
    Toast.show({
      type: "success",
      text1: t("common.copiedToClipboard"),
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Pressable
      onPress={copyToClipboard}
      className="p-2"
      accessibilityLabel={t("common.copyToClipboard")}
    >
      {copied ? (
        <Check size={20} color="#9ca3af" />
      ) : (
        <Copy size={20} color="#9ca3af" />
      )}
    </Pressable>
  );
}

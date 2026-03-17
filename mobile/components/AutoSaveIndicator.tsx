import { ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import { Check, AlertTriangle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AutoSaveStatus } from "@/hooks/useAutoSave";

type Props = {
  status: AutoSaveStatus;
};

export default function AutoSaveIndicator({ status }: Props) {
  const { t } = useTranslation("common");

  if (status === "idle") return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="bg-slate-900 absolute top-5 left-5 z-50 py-1 px-4 flex-row items-center rounded-lg gap-2"
    >
      {status === "saving" && (
        <>
          <ActivityIndicator size="small" color="#94a3b8" />
          <AppText className="text-sm text-slate-300">
            {t("common.autoSave.saving")}
          </AppText>
        </>
      )}
      {status === "saved" && (
        <>
          <Check size={16} color="#22c55e" />
          <AppText className="text-sm text-green-500">
            {t("common.autoSave.saved")}
          </AppText>
        </>
      )}
      {status === "error" && (
        <>
          <AlertTriangle size={16} color="#ef4444" />
          <AppText className="text-sm text-red-500">
            {t("common.autoSave.error")}
          </AppText>
        </>
      )}
    </Animated.View>
  );
}

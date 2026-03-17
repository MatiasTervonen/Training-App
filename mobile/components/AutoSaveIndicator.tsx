import { ActivityIndicator, View } from "react-native";
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
      className="bg-slate-900 absolute top-5 left-5 z-50 py-1 px-4 rounded-lg"
    >
      <View className="flex-row items-center gap-2">
        <View className="w-5 h-5 items-center justify-center">
          {status === "saving" && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              className="absolute"
            >
              <ActivityIndicator size="small" color="#94a3b8" />
            </Animated.View>
          )}
          {status === "saved" && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              className="absolute"
            >
              <Check size={16} color="#22c55e" />
            </Animated.View>
          )}
          {status === "error" && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              className="absolute"
            >
              <AlertTriangle size={16} color="#ef4444" />
            </Animated.View>
          )}
        </View>
        {/* Invisible widest label sets the container width; visible label is absolute */}
        <View>
          <AppText className="text-sm opacity-0">
            {t("common.autoSave.saving")}
          </AppText>
          {status === "saving" && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              className="absolute inset-0 justify-center"
            >
              <AppText className="text-sm text-slate-300">
                {t("common.autoSave.saving")}
              </AppText>
            </Animated.View>
          )}
          {status === "saved" && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              className="absolute inset-0 justify-center"
            >
              <AppText className="text-sm text-green-500">
                {t("common.autoSave.saved")}
              </AppText>
            </Animated.View>
          )}
          {status === "error" && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              className="absolute inset-0 justify-center"
            >
              <AppText className="text-sm text-red-500">
                {t("common.autoSave.error")}
              </AppText>
            </Animated.View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

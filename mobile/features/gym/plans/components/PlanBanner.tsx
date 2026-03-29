import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { CurrentPlan } from "@/database/gym/plans/get-current-plan";
import { ClipboardList } from "lucide-react-native";

type Props = {
  plan: CurrentPlan;
  onStartSession: () => void;
};

export default function PlanBanner({ plan, onStartSession }: Props) {
  const { t } = useTranslation("gym");

  const weekLabel = plan.total_weeks
    ? t("gym.plans.weekOf", { current: plan.current_week, total: plan.total_weeks })
    : t("gym.plans.weekInfinite", { current: plan.current_week });

  const nextName = plan.day_label || plan.exercises.map((e) => e.name).slice(0, 3).join(", ") || t("gym.plans.day", { number: plan.current_position + 1 });

  return (
    <LinearGradient
      colors={["rgba(34,211,238,0.15)", "rgba(34,211,238,0.05)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="border border-cyan-800 rounded-lg overflow-hidden"
    >
      <View className="px-4 pt-3 pb-2 gap-1">
        <View className="flex-row items-center gap-2">
          <ClipboardList size={18} color="#22d3ee" />
          <AppText className="text-lg" numberOfLines={1}>
            {plan.plan_name}
          </AppText>
        </View>
        <BodyText numberOfLines={1}>
          {weekLabel} · {t("gym.plans.nextSession", { name: nextName })}
        </BodyText>
      </View>
      <View className="px-4 pb-3 pt-1">
        <AnimatedButton
          onPress={onStartSession}
          className="btn-start"
        >
          <AppText className="text-center text-base" numberOfLines={1}>
            {t("gym.plans.startPlanSession")}
          </AppText>
        </AnimatedButton>
      </View>
    </LinearGradient>
  );
}

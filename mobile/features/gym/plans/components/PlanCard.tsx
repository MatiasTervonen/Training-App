import { View } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import DropDownModal from "@/components/DropDownModal";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { ClipboardList, Play } from "lucide-react-native";
import { TrainingPlanSummary } from "@/database/gym/plans/get-plans";

type Props = {
  item: TrainingPlanSummary;
  onDelete: () => void;
  onEdit: () => void;
  onPress: () => void;
};

export default function PlanCard({ item, onDelete, onEdit, onPress }: Props) {
  const { t } = useTranslation(["gym", "common"]);

  const weekInfo = item.total_weeks
    ? t("gym:gym.plans.weeksCount", { count: item.total_weeks })
    : t("gym:gym.plans.infinite");

  return (
    <AnimatedButton onPress={onPress}>
      <LinearGradient
        colors={
          item.is_active
            ? ["rgba(34,211,238,0.15)", "rgba(34,211,238,0.05)"]
            : ["rgba(59,130,246,0.12)", "rgba(59,130,246,0.04)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={`border rounded-md overflow-hidden ${item.is_active ? "border-cyan-700" : "border-slate-700"}`}
      >
        <View className="flex-row justify-between items-center px-4 pt-2 pb-1">
          <View className="flex-row items-center gap-2 flex-1 mr-4">
            <AppText className="text-lg" numberOfLines={1}>
              {item.name}
            </AppText>
            {item.is_active && (
              <View className="bg-cyan-900/50 px-2 py-0.5 rounded">
                <AppTextNC className="text-xs text-cyan-300">
                  {t("gym:gym.plans.activePlan")}
                </AppTextNC>
              </View>
            )}
          </View>
          <DropDownModal
            label={item.name}
            options={[
              { value: "edit", label: t("gym:gym.plans.edit") },
              { value: "delete", label: t("common:common.delete") },
            ]}
            onChange={(value) => {
              if (value === "edit") onEdit();
              if (value === "delete") onDelete();
            }}
          />
        </View>
        <View className="px-4 pb-2">
          <BodyTextNC className="text-sm text-slate-400">
            {weekInfo}
            {item.is_active && ` · ${t("gym:gym.plans.weekOf", { current: item.current_week, total: item.total_weeks || "∞" })}`}
          </BodyTextNC>
        </View>
        <View className="flex-row items-center justify-between bg-slate-900/40 px-4 py-2">
          <View className="flex-row items-center gap-2">
            <ClipboardList size={20} color="#cbd5e1" />
            <AppTextNC className="text-slate-400 text-sm">
              {t("gym:gym.plans.title")}
            </AppTextNC>
          </View>
          {item.is_active && (
            <View className="flex-row items-center gap-1">
              <Play size={14} color="#22d3ee" fill="#22d3ee" />
              <AppTextNC className="text-cyan-400 text-sm">
                {t("gym:gym.plans.nextSession", { name: "" }).replace(": ", "")}
              </AppTextNC>
            </View>
          )}
        </View>
      </LinearGradient>
    </AnimatedButton>
  );
}

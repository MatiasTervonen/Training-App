import { View, ActivityIndicator } from "react-native";
import { useState } from "react";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import BalanceBar from "@/features/energy-balance/components/BalanceBar";
import BreakdownRow from "@/features/energy-balance/components/BreakdownRow";
import { useEnergyBalance } from "@/features/energy-balance/hooks/useEnergyBalance";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Info } from "lucide-react-native";

type EnergyBalanceCardProps = {
  date: string;
};

export default function EnergyBalanceCard({ date }: EnergyBalanceCardProps) {
  const { t } = useTranslation("nutrition");
  const router = useRouter();
  const { data, isLoading } = useEnergyBalance(date);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <View className="mt-4 bg-slate-800/50 rounded-xl p-4 items-center">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (!data) return null;

  const isDeficit = data.balance < 0;
  const balanceColor = isDeficit ? "text-green-400" : "text-amber-400";
  const balanceLabel = isDeficit
    ? t("energyBalance.deficit")
    : t("energyBalance.surplus");

  return (
    <View className="mt-4 bg-slate-800/50 rounded-xl p-4">
      {/* Header */}
      <AnimatedButton
        onPress={() => setExpanded(!expanded)}
        className="flex-row justify-between items-center"
      >
        <AppText className="text-base">
          {t("energyBalance.title")}
        </AppText>
        {expanded ? (
          <ChevronUp size={20} color="#94a3b8" />
        ) : (
          <ChevronDown size={20} color="#94a3b8" />
        )}
      </AnimatedButton>

      {/* Balance summary (always visible) */}
      <View className="items-center mt-3">
        <BalanceBar balance={data.balance} tdee={data.tdee} />
        <View className="flex-row items-baseline mt-2 gap-1">
          <AppTextNC className={`text-xl ${balanceColor}`}>
            {data.balance > 0 ? "+" : ""}
            {Math.round(data.balance).toLocaleString()}
          </AppTextNC>
          <BodyText className="text-sm text-slate-400">
            kcal ({balanceLabel})
          </BodyText>
        </View>
      </View>

      {/* Expanded breakdown */}
      {expanded ? (
        <View className="mt-4">
          {/* Calories In */}
          <BreakdownRow
            label={t("energyBalance.caloriesIn")}
            value={data.calories_consumed}
          />

          {/* Divider */}
          <View className="h-px bg-slate-700 my-2" />

          {/* Calories Out breakdown */}
          <BreakdownRow
            label={t("energyBalance.bmr")}
            value={data.bmr}
          />
          <BreakdownRow
            label={t("energyBalance.exercise")}
            value={data.net_exercise_calories}
          />
          <BreakdownRow
            label={t("energyBalance.steps")}
            value={data.net_step_calories}
            detail={`(${data.step_count.toLocaleString()})`}
          />
          <BreakdownRow
            label={t("energyBalance.tef")}
            value={data.tef}
          />

          {/* Divider */}
          <View className="h-px bg-slate-700 my-2" />

          {/* Total */}
          <BreakdownRow
            label={t("energyBalance.totalBurn")}
            value={data.tdee}
          />

          {/* Profile prompt */}
          {!data.has_profile ? (
            <AnimatedButton
              onPress={() => router.push("/menu/profile")}
              className="flex-row items-center gap-2 mt-3 bg-slate-700/50 rounded-lg p-3"
            >
              <Info size={16} color="#60a5fa" />
              <BodyText className="text-xs text-blue-400 flex-1">
                {t("energyBalance.completeProfile")}
              </BodyText>
            </AnimatedButton>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

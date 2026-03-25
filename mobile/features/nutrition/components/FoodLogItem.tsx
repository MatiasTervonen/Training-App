import { memo } from "react";
import { View, Alert } from "react-native";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { DailyFoodLog } from "@/database/nutrition/get-daily-logs";
import { Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";

type FoodLogItemProps = {
  item: DailyFoodLog;
  onPress?: () => void;
  onDelete: () => void;
  showBorder?: boolean;
};

export default memo(function FoodLogItem({
  item,
  onPress,
  onDelete,
  showBorder = true,
}: FoodLogItemProps) {
  const { t: tCommon } = useTranslation();

  const handleDelete = () => {
    Alert.alert(
      tCommon("deleteButton.confirmDeleteTitle"),
      tCommon("deleteButton.confirmDeleteMessage"),
      [
        { text: tCommon("common.cancel"), style: "cancel" },
        { text: tCommon("common.delete"), style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <AnimatedButton
      onPress={onPress}
      className={`flex-row items-center px-3 py-3 ${showBorder ? "border-b border-slate-700/50" : ""}`}
    >
      <View className="flex-1 mr-3">
        <AppText className="text-sm" numberOfLines={1}>
          {item.food_name}
        </AppText>
        {item.brand && (
          <BodyTextNC className="text-xs text-slate-400" numberOfLines={1}>
            {item.brand}
          </BodyTextNC>
        )}
        <BodyTextNC className="text-xs text-slate-500">
          {item.serving_size_g}g x {item.quantity}
        </BodyTextNC>
      </View>
      <View className="items-end mr-3">
        <AppText className="text-sm">{Math.round(item.calories)}</AppText>
        <BodyTextNC className="text-xs text-slate-400">kcal</BodyTextNC>
      </View>
      <AnimatedButton onPress={handleDelete} hitSlop={10}>
        <Trash2 size={16} color="#64748b" />
      </AnimatedButton>
    </AnimatedButton>
  );
});

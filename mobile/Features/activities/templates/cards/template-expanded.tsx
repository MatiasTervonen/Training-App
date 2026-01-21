import { formatDate, formatMeters } from "@/lib/formatDate";
import { ScrollView, View } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { templateSummary } from "@/types/session";
import Map from "@/Features/activities/components/templateMap";
import { useFullScreenModalConfig } from "@/lib/stores/fullScreenModalConfig";
import { useState } from "react";
import SaveButtonSpinner from "@/components/buttons/SaveButtonSpinner";

type Props = {
  item: templateSummary;
  onStartActivity: () => void;
  isStartingActivity: boolean;
};

export default function ActivityTemplateExpanded({
  item,
  onStartActivity,
  isStartingActivity,
}: Props) {
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const setSwipeEnabled = useFullScreenModalConfig(
    (state) => state.setSwipeEnabled
  );

  return (
    <ScrollView
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
    >
      <PageContainer className="mb-10">
        <AppText className="text-sm text-gray-300 text-center">
          Created: {formatDate(item.template.created_at)}
        </AppText>
        {item.template.updated_at && (
          <AppText className="text-sm text-yellow-500 mt-2 text-center">
            Updated: {formatDate(item.template.updated_at)}
          </AppText>
        )}
        <View className="items-center bg-slate-900 p-5 rounded-md shadow-md mt-5">
          <AppText className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
            {item.template.name}
          </AppText>
          <AppText className="text-lg text-left mb-5">
            {item.activity.name}
          </AppText>
          {item.template.distance_meters && (
            <AppText className="text-xl text-center mb-5">
              Distance: {formatMeters(item.template.distance_meters)}
            </AppText>
          )}
          {item.template.notes && (
            <AppText className="text-lg text-left">
              {item.template.notes}
            </AppText>
          )}
        </View>
        <View className="mt-10">
          <Map
            template={item}
            setScrollEnabled={setScrollEnabled}
            setSwipeEnabled={setSwipeEnabled}
          />
        </View>
        <View className="mt-10">
          <SaveButtonSpinner
            disabled={isStartingActivity}
            onPress={onStartActivity}
            label="Start Activity"
            loading={isStartingActivity}
          />
        </View>
      </PageContainer>
    </ScrollView>
  );
}

import { useEffect, useRef } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import AppTextNC from "@/components/AppTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";
import type { ActivityType } from "@/database/activities/myActivitySessions/get-activity-types";

const TAB_WIDTH = 100;
const GAP = 8;
const CONTAINER_PADDING = 4;
const SCROLL_PADDING = 16;

type ActivityTypeFilterChipsProps = {
  activityTypes: ActivityType[];
  selectedSlug: string | null;
  onSelectAll: () => void;
  onSelectType: (slug: string) => void;
};

export default function ActivityTypeFilterChips({
  activityTypes,
  selectedSlug,
  onSelectAll,
  onSelectType,
}: ActivityTypeFilterChipsProps) {
  const { t } = useTranslation("activities");
  const isAllSelected = !selectedSlug;
  const scrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    const activeIndex = selectedSlug
      ? activityTypes.findIndex((a) => a.slug === selectedSlug) + 1
      : 0;

    const tabCenter =
      SCROLL_PADDING +
      CONTAINER_PADDING +
      activeIndex * (TAB_WIDTH + GAP) +
      TAB_WIDTH / 2;

    const scrollX = Math.max(0, tabCenter - screenWidth / 2);
    scrollRef.current?.scrollTo({ x: scrollX, animated: true });
  }, [selectedSlug, activityTypes, screenWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: SCROLL_PADDING }}
      className="mt-3 mb-1 mx-4 bg-slate-800 rounded-lg flex-none"
    >
      <View className="flex-row p-1 gap-2">
        <AnimatedButton
          onPress={onSelectAll}
          className={`w-[100px] py-2 px-3 rounded-md ${isAllSelected ? "bg-slate-700" : ""}`}
        >
          <AppTextNC
            numberOfLines={1}
            className={`text-center font-medium ${
              isAllSelected ? "text-cyan-400" : "text-gray-200"
            }`}
          >
            {t("activities.mySessions.all")}
          </AppTextNC>
        </AnimatedButton>

        {activityTypes.map((type) => {
          const isActive = selectedSlug === type.slug;
          const translationKey = `activities.activityNames.${type.slug}`;
          const translated = t(translationKey, { defaultValue: type.name });
          return (
            <AnimatedButton
              key={type.slug}
              onPress={() => onSelectType(type.slug)}
              className={`w-[100px] py-2 px-3 rounded-md ${isActive ? "bg-slate-700" : ""}`}
            >
              <AppTextNC
                numberOfLines={1}
                className={`text-center font-medium ${
                  isActive ? "text-cyan-400" : "text-gray-200"
                }`}
              >
                {translated}
              </AppTextNC>
            </AnimatedButton>
          );
        })}
      </View>
    </ScrollView>
  );
}

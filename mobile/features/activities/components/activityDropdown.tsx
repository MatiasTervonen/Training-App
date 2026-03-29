import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import ErrorMessage from "@/components/ErrorMessage";
import { useQuery } from "@tanstack/react-query";
import { getActivities } from "@/database/activities/get-activities";
import {
  TouchableWithoutFeedback,
  Keyboard,
  View,
  ActivityIndicator,
  SectionList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useFullScreenModalScroll } from "@/components/FullScreenModal";
import AppInput from "@/components/AppInput";
import { useCallback, useState, useMemo } from "react";
import { getRecentActivities } from "@/database/activities/recent-activities";
import { activities_with_category } from "@/types/models";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";

type Props = {
  onSelect: (activity: activities_with_category) => void;
};

export default function ActivityDropdown({ onSelect }: Props) {
  const { t } = useTranslation("activities");
  const modalScroll = useFullScreenModalScroll();
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] =
    useState<activities_with_category | null>(null);

  const getActivityName = useCallback(
    (activity: activities_with_category) => {
      if (activity.slug) {
        const translated = t(`activities.activityNames.${activity.slug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.activityNames.${activity.slug}`
        ) {
          return translated;
        }
      }
      return activity.name;
    },
    [t],
  );

  const getCategoryName = useCallback(
    (activity: activities_with_category) => {
      const categorySlug = activity.activity_categories?.slug;
      if (categorySlug) {
        const translated = t(`activities.categories.${categorySlug}`, {
          defaultValue: "",
        });
        if (
          translated &&
          translated !== `activities.categories.${categorySlug}`
        ) {
          return translated;
        }
      }
      return activity.activity_categories?.name || "";
    },
    [t],
  );

  const {
    data: allActivities,
    error: activitiesError,
    isLoading: isActivitiesLoading,
  } = useQuery({
    queryKey: ["activities"],
    queryFn: () => getActivities(),
  });

  const {
    data: recentActivities,
    error: recentError,
    isLoading: isRecentLoading,
  } = useQuery({
    queryKey: ["recentActivities"],
    queryFn: getRecentActivities,
  });

  const isLoading = isActivitiesLoading || isRecentLoading;
  const isError = activitiesError || recentError;

  const recentActivitiesList = recentActivities || [];

  const filteredActivities = useMemo(() => {
    const list = allActivities || [];
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((activity) => {
      const translatedName = getActivityName(activity).toLowerCase();
      const translatedCategory = getCategoryName(activity).toLowerCase();
      return (
        translatedName.includes(query) ||
        translatedCategory.includes(query) ||
        activity.name.toLowerCase().includes(query)
      );
    });
  }, [allActivities, searchQuery, getActivityName, getCategoryName]);

  const sections = [];

  if (!isError && !isLoading) {
    if (recentActivitiesList.length > 0 && searchQuery.length === 0) {
      sections.push({
        title: t("activities.activityDropdown.recentActivities"),
        data: recentActivitiesList,
      });
    }

    sections.push({
      title: t("activities.activityDropdown.allActivities"),
      data: filteredActivities,
    });
  }

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (modalScroll) {
        modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
      }
    },
    [modalScroll],
  );

  const handleSelectActivity = (activity: activities_with_category) => {
    setSearchQuery("");
    onSelect(activity);
    setSelectedActivity(activity);
    setInputValue(getActivityName(activity));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="w-full z-50 flex-1">
        <View className="w-full px-4">
          <AppInput
            value={inputValue}
            placeholder={t("activities.activityDropdown.searchPlaceholder")}
            autoComplete="off"
            onChangeText={(text) => {
              setInputValue(text);
              setSearchQuery(text);
            }}
            spellCheck={false}
          />
        </View>
        <View
          className="w-full border border-gray-700 mt-4 flex-1 rounded-md overflow-hidden"
        >
          {isError ? (
            <ErrorMessage message={t("activities.activityDropdown.loadError")} fullPage />
          ) : isLoading ? (
            <View className="items-center justify-center gap-3 mt-20">
              <AppText className="text-xl">
                {t("activities.activityDropdown.loading")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : filteredActivities.length === 0 ? (
            <AppText className="text-lg text-gray-300 mt-20 text-center">
              {t("activities.activityDropdown.noActivities")}
            </AppText>
          ) : (
            <SectionList
              contentContainerStyle={{
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              sections={sections}
              keyExtractor={(item: activities_with_category) => item.id}
              renderItem={({ item, index }: { item: activities_with_category; index: number }) => {
                return (
                  <AnimatedButton
                    className={`w-full text-left px-4 py-2 z-40 border-b border-gray-700 ${selectedActivity?.id === item.id ? "bg-indigo-500/20" : index % 2 === 1 ? "bg-slate-800/50" : ""}`}
                    onPress={() => {
                      handleSelectActivity(item);

                      setSelectedActivity(item);
                    }}
                  >
                    <View className="justify-between">
                      <View className="flex-row justify-between items-center">
                        <BodyText
                          className="text-gray-200 text-[17px] mb-1 mr-4 flex-1"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {getActivityName(item)}
                        </BodyText>
                        <AppText className="text-md text-gray-300 shrink-0">
                          {getCategoryName(item)}
                        </AppText>
                      </View>
                    </View>
                  </AnimatedButton>
                );
              }}
              renderSectionHeader={({ section: { title } }) => (
                <AppText className="text-center text-base bg-blue-500/20 border-y border-blue-500/40 py-0.5">
                  {title}
                </AppText>
              )}
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

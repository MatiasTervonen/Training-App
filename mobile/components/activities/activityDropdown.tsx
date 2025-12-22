import AppText from "@/components/AppText";
import { useQuery } from "@tanstack/react-query";
import GetActivities from "@/database/activities/get-activities";
import {
  TouchableWithoutFeedback,
  Keyboard,
  View,
  ActivityIndicator,
  SectionList,
} from "react-native";
import AppInput from "@/components/AppInput";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { getRecentActivities } from "@/database/activities/recent-activities";
import { Activity } from "@/types/models";
import AnimatedButton from "@/components/buttons/animatedButton";

type Props = {
  onSelect: (activity: Activity) => void;
  resetTrigger?: number;
};

export default function ActivityDropdown({ onSelect, resetTrigger }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  const {
    data: allActivities,
    error: activitiesError,
    isLoading: isActivitiesLoading,
  } = useQuery({
    queryKey: ["activities", searchQuery],
    queryFn: () => GetActivities(searchQuery),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: recentActivities,
    error: recentError,
    isLoading: isRecentLoading,
  } = useQuery({
    queryKey: ["recentActivities"],
    queryFn: getRecentActivities,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const isLoading = isActivitiesLoading || isRecentLoading;
  const isError = activitiesError || recentError;

  const allActivitiesList = allActivities || [];
  const recentActivitiesList = recentActivities || [];

  const sections = [];

  if (!isError && !isLoading) {
    if (recentActivitiesList.length > 0 && searchQuery.length === 0) {
      sections.push({
        title: "Recent Activities",
        data: recentActivitiesList,
      });
    }

    sections.push({
      title: "All Activities",
      data: allActivitiesList,
    });
  }

  const handleSearchChange = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
  }, 400);

  const handleSelectActivity = (activity: Activity) => {
    setSearchQuery("");
    onSelect(activity);
    setSelectedActivity(activity);
    setInputValue(activity.name);
  };

  useEffect(() => {
    setSearchQuery("");
  }, [resetTrigger]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="w-full z-50 flex-1">
        <View className="w-full px-4">
          <AppInput
            value={inputValue}
            placeholder="Search activities..."
            autoComplete="off"
            onChangeText={(text) => {
              setInputValue(text);
              handleSearchChange(text);
            }}
            spellCheck={false}
          />
        </View>
        <View
          className="w-full  
                    bg-slate-900 border border-gray-100 mt-10 flex-1 rounded-md overflow-hidden"
        >
          {isLoading || isError || allActivitiesList.length === 0 ? (
            <View className="gap-6 items-center justify-center z-50 text-center mt-20">
              {isLoading && (
                <>
                  <AppText className="text-xl">Loading activities...</AppText>
                  <ActivityIndicator />
                </>
              )}
              {isError && (
                <AppText className="text-red-500 text-xl">
                  Failed to load activities. Try again!
                </AppText>
              )}
              {!isLoading && allActivitiesList.length === 0 && (
                <AppText className="text-lg text-gray-300">
                  No activities found.
                </AppText>
              )}
            </View>
          ) : (
            <SectionList
              contentContainerStyle={{
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
              sections={sections}
              keyExtractor={(item: Activity) => item.id}
              renderItem={({ item }: { item: Activity }) => {
                return (
                  <AnimatedButton
                    className={`w-full text-left px-4 py-2 z-40 border-b border-gray-400 ${selectedActivity?.id === item.id ? "bg-blue-800" : ""}`}
                    onPress={() => {
                      handleSelectActivity(item);

                      setSelectedActivity(item);
                    }}
                  >
                    <View className="justify-between">
                      <View className="flex-row justify-between items-center">
                        <AppText
                          className="text-lg mb-1 mr-4 flex-1"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.name}
                        </AppText>
                        <AppText className="text-md text-gray-300 shrink-0">
                          {item.category}
                        </AppText>
                      </View>
                    </View>
                  </AnimatedButton>
                );
              }}
              renderSectionHeader={({ section: { title } }) => (
                <AppText className="text-center text-lg bg-blue-600">
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

import AppText from "@/components/AppText";
import { useQuery } from "@tanstack/react-query";
import {
  TouchableWithoutFeedback,
  Keyboard,
  View,
  ActivityIndicator,
  FlatList,
} from "react-native";
import AppInput from "@/components/AppInput";
import { useState, useCallback } from "react";

import AnimatedButton from "@/components/buttons/animatedButton";
import {
  getUserActivities,
  UserActivity,
} from "@/database/activities/get-user-activities";
import { useDebouncedCallback } from "use-debounce";
import { useTranslation } from "react-i18next";

type Props = {
  onSelect: (activity: UserActivity) => void;
};

export default function UserActivityDropdownEdit({ onSelect }: Props) {
  const { t } = useTranslation("activities");
  const [inputValue, setInputValue] = useState("");
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);

  const getCategoryName = useCallback(
    (activity: UserActivity) => {
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

  const { data, error, isLoading } = useQuery({
    queryKey: ["userActivities"],
    queryFn: () => getUserActivities(),
  });

  const handleSearchChange = useDebouncedCallback((value: string) => {
    if (!value.trim()) {
      setFilteredActivities([]);
      setIsSearching(false);
      return;
    }

    const filtered =
      data?.filter((activity) => {
        const text = activity.name.toLowerCase();
        return value
          .toLowerCase()
          .split(" ")
          .every((word) => text.includes(word));
      }) || [];
    setFilteredActivities(filtered);
    setIsSearching(false);
  }, 400);

  const listData = inputValue.length > 0 ? filteredActivities : data || [];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="px-2 w-full z-50 flex-1">
        <View className="mt-10 w-full px-14">
          <AppInput
            value={inputValue}
            placeholder={t("activities.activityDropdownEdit.searchPlaceholder")}
            autoComplete="off"
            onChangeText={(text) => {
              setInputValue(text);

              if (!text.trim()) {
                setFilteredActivities([]);
                setIsSearching(false);
                return;
              }

              setIsSearching(true);
              handleSearchChange(text);
            }}
            spellCheck={false}
          />
        </View>

        <View
          className="w-full  
                    bg-slate-900 border border-gray-100 mt-10 flex-1 rounded-md overflow-hidden"
        >
          {error ? (
            <AppText className="text-red-500 text-xl mt-20 text-center">
              {t("activities.activityDropdownEdit.loadError")}
            </AppText>
          ) : isLoading ? (
            <View className="items-center justify-center gap-3 mt-20">
              <AppText className="text-xl">
                {t("activities.activityDropdownEdit.loading")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : isSearching ? (
            <View className="items-center justify-center gap-3 mt-20">
              <AppText className="text-xl">
                {t("activities.activityDropdownEdit.searching")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : !isSearching && listData.length === 0 ? (
            <View className="items-center self-center gap-3 text-lg px-5 mt-20">
              <AppText>
                {t("activities.activityDropdownEdit.noActivities")}
              </AppText>
              <AppText>
                {t("activities.activityDropdownEdit.addNewActivity")}
              </AppText>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={{
                paddingBottom: 100,
              }}
              showsVerticalScrollIndicator={false}
              data={inputValue.length > 0 ? filteredActivities : data || []}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                <AppText className="text-center text-lg bg-blue-600 rounded-t-md">
                  {t("activities.activityDropdownEdit.myActivities")}
                </AppText>
              }
              renderItem={({ item }) => {
                return (
                  <AnimatedButton
                    className={`w-full text-left px-4 py-2 z-40 border-b border-gray-400`}
                    onPress={() => {
                      setInputValue(item.name);
                      onSelect(item);
                      setFilteredActivities([item]);
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
                          {getCategoryName(item)}
                        </AppText>
                      </View>
                    </View>
                  </AnimatedButton>
                );
              }}
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

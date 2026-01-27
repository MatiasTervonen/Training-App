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
import { useState } from "react";

import AnimatedButton from "@/components/buttons/animatedButton";
import { getUserActivities } from "@/database/activities/get-user-activities";
import { useDebouncedCallback } from "use-debounce";

type UserActivity = {
  id: string;
  name: string;
  activity_categories: { name: string }[];
};

type Props = {
  onSelect: (activity: UserActivity) => void;
};

export default function UserActivityDropdownEdit({ onSelect }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);

  const { data, error, isLoading } = useQuery({
    queryKey: ["userActivities"],
    queryFn: () => getUserActivities(),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
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
            placeholder="Search activities..."
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
              Failed to load activities. Try again!
            </AppText>
          ) : isLoading ? (
            <View className="items-center justify-center gap-3 mt-20">
              <AppText className="text-xl">Loading activities...</AppText>
              <ActivityIndicator />
            </View>
          ) : isSearching ? (
            <View className="items-center justify-center gap-3 mt-20">
              <AppText className="text-xl">Searching for activities...</AppText>
              <ActivityIndicator />
            </View>
          ) : inputValue.length > 0 && !isSearching && listData.length === 0 ? (
            <View className="items-center self-center gap-3 text-lg px-5 mt-20">
              <AppText>No activities found.</AppText>
              <AppText>Get started by adding a new activity!</AppText>
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
                  My Activities
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
                          {item.activity_categories[0]?.name}
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

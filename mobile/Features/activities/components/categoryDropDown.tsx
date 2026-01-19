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
import { getActivityCategories } from "@/database/activities/get-categories";
import { useDebouncedCallback } from "use-debounce";

type Props = {
    onSelect: (category: activityCategory) => void;
};

type activityCategory = {
    id: string;
    name: string;
};

export default function CategoryDropdown({ onSelect }: Props) {
    const [inputValue, setInputValue] = useState("")
    const [filteredCategories, setFilteredCategories] = useState<activityCategory[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const {
        data,
        error,
        isLoading,
    } = useQuery<activityCategory[]>({
        queryKey: ["activityCategories"],
        queryFn: getActivityCategories,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const handleSearchChange = useDebouncedCallback((value: string) => {
        if (!value.trim()) {
            setFilteredCategories([]);
            setIsSearching(false);
            return;
        }

        const filtered = data?.filter((category) => {
            const text = category.name.toLowerCase();
            return value.toLowerCase().split(" ").every((word) => text.includes(word));
        }) || [];
        setFilteredCategories(filtered);
        setIsSearching(false);
    }, 400);


    const listData =
        inputValue.length > 0 ? filteredCategories : data || [];

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="px-2 w-full z-50 flex-1 mb-10">
                <View className="mt-10 w-full px-14">
                    <AppInput
                        value={inputValue}
                        placeholder="Search categories..."
                        autoComplete="off"
                        onChangeText={(text) => {
                            setInputValue(text);

                            if (!text.trim()) {
                                setFilteredCategories([]);
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
                            Failed to load categories. Try again!
                        </AppText>
                    ) : isLoading ? (
                        <View className="items-center justify-center gap-3 mt-20">
                            <AppText className="text-xl">Loading categories...</AppText>
                            <ActivityIndicator />
                        </View>
                    ) : isSearching ? (
                        <View className="items-center justify-center gap-3 mt-20">
                            <AppText className="text-xl">Searching for categories...</AppText>
                            <ActivityIndicator />
                        </View>
                    ) : inputValue.length > 0 && !isSearching && listData.length === 0 ? (
                        <View className="items-center self-center gap-3 text-lg px-5 mt-20">
                            <AppText>No categories found.</AppText>
                            <AppText>Get started by adding a new category!</AppText>
                        </View>
                    ) : (
                        <FlatList
                            contentContainerStyle={{
                                paddingBottom: 100,
                            }}
                            showsVerticalScrollIndicator={false}
                            data={listData}
                            keyExtractor={(item) => item.id}
                            ListHeaderComponent={
                                <AppText className="text-center text-lg bg-blue-600 rounded-t-md">
                                    Activity Categories
                                </AppText>
                            }
                            renderItem={({ item }) => {
                                console.log(item)
                                return (
                                    <AnimatedButton
                                        className={`w-full text-left px-4 py-2 z-40 border-b border-gray-400`}
                                        onPress={() => {
                                            setInputValue(item.name);
                                            setFilteredCategories([item]);
                                            onSelect(item);
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



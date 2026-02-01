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
import { useTranslation } from "react-i18next";

type Props = {
    onSelect: (category: activityCategory) => void;
};

type activityCategory = {
    id: string;
    name: string;
    slug: string | null;
};

export default function CategoryDropdown({ onSelect }: Props) {
    const { t } = useTranslation("activities");
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

    // Helper function to get translated category name
    const getCategoryName = (category: activityCategory) => {
        if (category.slug) {
            const translated = t(`activities.categories.${category.slug}`, { defaultValue: "" });
            if (translated && translated !== `activities.categories.${category.slug}`) {
                return translated;
            }
        }
        return category.name;
    };

    const handleSearchChange = useDebouncedCallback((value: string) => {
        if (!value.trim()) {
            setFilteredCategories([]);
            setIsSearching(false);
            return;
        }

        const filtered = data?.filter((category) => {
            const translatedName = getCategoryName(category).toLowerCase();
            const originalName = category.name.toLowerCase();
            return value.toLowerCase().split(" ").every((word) =>
                translatedName.includes(word) || originalName.includes(word)
            );
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
                        placeholder={t("activities.categoryDropdown.searchPlaceholder")}
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
                            {t("activities.categoryDropdown.loadError")}
                        </AppText>
                    ) : isLoading ? (
                        <View className="items-center justify-center gap-3 mt-20">
                            <AppText className="text-xl">
                                {t("activities.categoryDropdown.loading")}
                            </AppText>
                            <ActivityIndicator />
                        </View>
                    ) : isSearching ? (
                        <View className="items-center justify-center gap-3 mt-20">
                            <AppText className="text-xl">
                                {t("activities.categoryDropdown.searching")}
                            </AppText>
                            <ActivityIndicator />
                        </View>
                    ) : inputValue.length > 0 && !isSearching && listData.length === 0 ? (
                        <View className="items-center self-center gap-3 text-lg px-5 mt-20">
                            <AppText>{t("activities.categoryDropdown.noCategories")}</AppText>
                            <AppText>{t("activities.categoryDropdown.addNewCategory")}</AppText>
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
                                    {t("activities.categoryDropdown.title")}
                                </AppText>
                            }
                            renderItem={({ item }) => {
                                return (
                                    <AnimatedButton
                                        className={`w-full text-left px-4 py-2 z-40 border-b border-gray-400`}
                                        onPress={() => {
                                            setInputValue(getCategoryName(item));
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



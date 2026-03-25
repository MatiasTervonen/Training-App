import { useEffect, useRef, ReactNode } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";
import AppTextNC from "@/components/AppTextNC";

const TAB_WIDTH = 100;
const GAP = 8;
const CONTAINER_PADDING = 4;
const SCROLL_PADDING = 16;

type FolderFilterChipsProps = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelectAll: () => void;
  onSelectFolder: (folderId: string) => void;
  rightIcon?: ReactNode;
};

export default function FolderFilterChips({
  folders,
  selectedFolderId,
  onSelectAll,
  onSelectFolder,
  rightIcon,
}: FolderFilterChipsProps) {
  const { t } = useTranslation("notes");
  const isAllSelected = !selectedFolderId;
  const scrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    const activeIndex = selectedFolderId
      ? folders.findIndex((f) => f.id === selectedFolderId) + 1
      : 0;

    const tabCenter =
      SCROLL_PADDING +
      CONTAINER_PADDING +
      activeIndex * (TAB_WIDTH + GAP) +
      TAB_WIDTH / 2;

    const scrollX = Math.max(0, tabCenter - screenWidth / 2);
    scrollRef.current?.scrollTo({ x: scrollX, animated: true });
  }, [selectedFolderId, folders, screenWidth]);

  return (
    <View className="mt-[6px] mb-1 mx-3 bg-slate-800 rounded-lg flex-row items-center">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
        className="flex-1"
      >
        <View className="flex-row p-1 gap-2">
          <AnimatedButton
            onPress={onSelectAll}
            className={`w-[100px] py-2 px-3 rounded-md ${isAllSelected ? "bg-slate-700" : ""}`}
          >
            <AppTextNC
              numberOfLines={1}
              className={`text-center font-medium ${
                isAllSelected ? "text-purple-400" : "text-gray-200"
              }`}
            >
              {t("notes.folders.all")}
            </AppTextNC>
          </AnimatedButton>

          {folders.map((folder) => {
            const isActive = selectedFolderId === folder.id;
            return (
              <AnimatedButton
                key={folder.id}
                onPress={() => onSelectFolder(folder.id)}
                className={`w-[100px] py-2 px-3 rounded-md ${isActive ? "bg-slate-700" : ""}`}
              >
                <AppTextNC
                  numberOfLines={1}
                  className={`text-center font-medium ${
                    isActive ? "text-purple-400" : "text-gray-200"
                  }`}
                >
                  {folder.name}
                </AppTextNC>
              </AnimatedButton>
            );
          })}
        </View>
      </ScrollView>
      {rightIcon}
    </View>
  );
}

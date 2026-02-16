import { ScrollView, Pressable } from "react-native";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

type FolderFilterChipsProps = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  isUnfiledSelected: boolean;
  onSelectAll: () => void;
  onSelectUnfiled: () => void;
  onSelectFolder: (folderId: string) => void;
};

export default function FolderFilterChips({
  folders,
  selectedFolderId,
  isUnfiledSelected,
  onSelectAll,
  onSelectUnfiled,
  onSelectFolder,
}: FolderFilterChipsProps) {
  const { t } = useTranslation("notes");
  const isAllSelected = !selectedFolderId && !isUnfiledSelected;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-3"
    >
      <Pressable
        onPress={onSelectAll}
        className={`px-4 py-1.5 rounded-full ${
          isAllSelected
            ? "bg-blue-600"
            : "bg-slate-800 border border-slate-600"
        }`}
      >
        <AppText
          className={`text-sm ${
            isAllSelected ? "text-white" : "text-slate-300"
          }`}
        >
          {t("notes.folders.all")}
        </AppText>
      </Pressable>

      <Pressable
        onPress={onSelectUnfiled}
        className={`px-4 py-1.5 rounded-full ${
          isUnfiledSelected
            ? "bg-blue-600"
            : "bg-slate-800 border border-slate-600"
        }`}
      >
        <AppText
          className={`text-sm ${
            isUnfiledSelected ? "text-white" : "text-slate-300"
          }`}
        >
          {t("notes.folders.unfiled")}
        </AppText>
      </Pressable>

      {folders.map((folder) => {
        const isActive = selectedFolderId === folder.id;
        return (
          <Pressable
            key={folder.id}
            onPress={() => onSelectFolder(folder.id)}
            className={`px-4 py-1.5 rounded-full ${
              isActive
                ? "bg-blue-600"
                : "bg-slate-800 border border-slate-600"
            }`}
          >
            <AppText
              className={`text-sm ${
                isActive ? "text-white" : "text-slate-300"
              }`}
              numberOfLines={1}
            >
              {folder.name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

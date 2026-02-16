import { ScrollView } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

type FolderFilterChipsProps = {
  folders: FolderWithCount[];
  selectedFolderId: string | null;
  onSelectAll: () => void;
  onSelectFolder: (folderId: string) => void;
};

export default function FolderFilterChips({
  folders,
  selectedFolderId,
  onSelectAll,
  onSelectFolder,
}: FolderFilterChipsProps) {
  const { t } = useTranslation("notes");
  const isAllSelected = !selectedFolderId;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-3"
    >
      <AnimatedButton
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
      </AnimatedButton>

      {folders.map((folder) => {
        const isActive = selectedFolderId === folder.id;
        return (
          <AnimatedButton
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
          </AnimatedButton>
        );
      })}
    </ScrollView>
  );
}

import { View, Pressable, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import { Check, FolderOpen, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import FullScreenModal from "@/components/FullScreenModal";
import useMoveNoteToFolder from "@/features/notes/hooks/useMoveNoteToFolder";
import type { FolderWithCount } from "@/database/notes/get-folders";

type MoveToFolderSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  currentFolderId: string | null;
  folders: FolderWithCount[];
};

export default function MoveToFolderSheet({
  isOpen,
  onClose,
  noteId,
  currentFolderId,
  folders,
}: MoveToFolderSheetProps) {
  const { t } = useTranslation("notes");
  const { handleMove } = useMoveNoteToFolder();

  const onSelect = async (folderId: string | null, folderName?: string) => {
    if (folderId === currentFolderId) {
      onClose();
      return;
    }
    await handleMove(noteId, folderId, folderName);
    onClose();
  };

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <View className="flex-1 px-5 pt-5">
        <AppText className="text-xl text-center mb-6">
          {t("notes.folders.moveToFolder")}
        </AppText>

        <ScrollView showsVerticalScrollIndicator={false}>
          {currentFolderId && (
            <Pressable
              onPress={() => onSelect(null)}
              className="flex-row items-center justify-between px-4 py-4 border-b border-slate-700"
            >
              <View className="flex-row items-center gap-3">
                <X size={18} color="#ef4444" />
                <AppText className="text-red-400">
                  {t("notes.folders.removeFromFolder")}
                </AppText>
              </View>
            </Pressable>
          )}

          {folders.map((folder) => {
            const isCurrentFolder = currentFolderId === folder.id;
            return (
              <Pressable
                key={folder.id}
                onPress={() => onSelect(folder.id, folder.name)}
                className={`flex-row items-center justify-between px-4 py-4 border-b border-slate-700 ${
                  isCurrentFolder ? "bg-slate-800" : ""
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <FolderOpen size={18} color="#94a3b8" />
                  <AppText className="text-slate-200">{folder.name}</AppText>
                </View>
                {isCurrentFolder && <Check size={18} color="#3b82f6" />}
              </Pressable>
            );
          })}

          {folders.length === 0 && (
            <AppText className="text-center text-lg mt-10 text-slate-400">
              {t("notes.folders.noFolders")}
            </AppText>
          )}
        </ScrollView>
      </View>
    </FullScreenModal>
  );
}

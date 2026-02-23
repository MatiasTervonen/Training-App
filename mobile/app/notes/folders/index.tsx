import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import { useState } from "react";
import ModalPageWrapper from "@/components/ModalPageWrapper";
import useFolders from "@/features/notes/hooks/useFolders";
import useCreateFolder from "@/features/notes/hooks/useCreateFolder";
import useRenameFolder from "@/features/notes/hooks/useRenameFolder";
import useDeleteFolder from "@/features/notes/hooks/useDeleteFolder";
import { Trash2, Pencil, Check, X, ArrowRight } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { FolderWithCount } from "@/database/notes/get-folders";

export default function ManageFoldersScreen() {
  const { t } = useTranslation("notes");
  const { folders, isLoading } = useFolders();
  const { createFolder } = useCreateFolder();
  const { handleRename } = useRenameFolder();
  const { handleDelete } = useDeleteFolder();
  const router = useRouter();

  const [newFolderName, setNewFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = async () => {
    if (!newFolderName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await createFolder(newFolderName);
      setNewFolderName("");
    } catch {
      // Error handled in hook
    } finally {
      setIsCreating(false);
    }
  };

  const startRename = (folder: FolderWithCount) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
  };

  const confirmRename = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await handleRename(editingId, editingName);
    } catch {
      // Error handled in hook
    }
    setEditingId(null);
    setEditingName("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <ModalPageWrapper>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-5 pt-5 pb-20">
          <AppText className="text-2xl text-center mb-8">
            {t("notes.folders.title")}
          </AppText>

          {/* Create folder input */}
          <View className="gap-4 mb-8">
            <View className="flex-1">
              <AppInput
                value={newFolderName}
                setValue={setNewFolderName}
                label={t("notes.folders.folderName")}
                placeholder={t("notes.folders.folderNamePlaceholder")}
              />
            </View>    
              <AnimatedButton
                onPress={handleCreate}
                disabled={!newFolderName.trim() || isCreating}
                className="btn-base"
              >
                <AppText className="text-gray-100 text-center">
                  {t("notes.folders.createFolder")}
                </AppText>
              </AnimatedButton>
          </View>

          {/* Loading state */}
          {isLoading && (
            <View className="gap-4">
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="h-14 bg-slate-800 rounded-lg animate-pulse"
                />
              ))}
            </View>
          )}

          {/* Empty state */}
          {!isLoading && folders.length === 0 && (
            <AppText className="text-center text-lg mt-10 mx-auto">
              {t("notes.folders.noFolders")}
            </AppText>
          )}

          {/* Folder list */}
          {!isLoading && folders.length > 0 && (
            <View className="gap-2">
              {folders.map((folder) => (
                <View
                  key={folder.id}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 flex-row items-center justify-between"
                >
                  {editingId === folder.id ? (
                    <View className="flex-1 flex-row items-center gap-2">
                      <View className="flex-1">
                        <AppInput
                          value={editingName}
                          setValue={setEditingName}
                          autoFocus
                        />
                      </View>
                      <AnimatedButton onPress={confirmRename} className="p-2">
                        <Check size={20} color="#22c55e" />
                      </AnimatedButton>
                      <AnimatedButton onPress={cancelRename} className="p-2">
                        <X size={20} color="#94a3b8" />
                      </AnimatedButton>
                    </View>
                  ) : (
                    <>
                      <AnimatedButton
                        onPress={() =>
                          router.push({
                            pathname: "/notes/my-notes",
                            params: { folder: folder.id },
                          })
                        }
                        className="flex-1 mr-3"
                      >
                        <AppText className="text-slate-200" numberOfLines={1}>
                          {folder.name}
                        </AppText>
                        <AppText className="text-xs text-slate-400">
                          {t("notes.folders.noteCount", {
                            count: folder.note_count,
                          })}
                        </AppText>
                      </AnimatedButton>
                      <View className="flex-row items-center gap-2">
                        <AnimatedButton
                          onPress={() => startRename(folder)}
                          className="p-2"
                        >
                          <Pencil size={18} color="#94a3b8" />
                        </AnimatedButton>
                        <AnimatedButton
                          onPress={() => handleDelete(folder)}
                          className="p-2"
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </AnimatedButton>
                        <AnimatedButton
                          onPress={() =>
                            router.push({
                              pathname: "/notes/my-notes",
                              params: { folder: folder.id },
                            })
                          }
                          className="p-2"
                        >
                          <ArrowRight size={18} color="#94a3b8" />
                        </AnimatedButton>
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ModalPageWrapper>
  );
}

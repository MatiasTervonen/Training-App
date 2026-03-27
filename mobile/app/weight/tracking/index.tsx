import { View, TouchableWithoutFeedback, Keyboard, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AppInput from "@/components/AppInput";
import { useState } from "react";
import { formatDateShort } from "@/lib/formatDate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageContainer from "@/components/PageContainer";
import SubNotesInput from "@/components/SubNotesInput";
import useWeightDraft from "@/features/weight/hooks/useDraft";
import useSaveWeight from "@/features/weight/hooks/useSaveWeight";
import { useTranslation } from "react-i18next";
import MediaToolbar from "@/features/notes/components/MediaToolbar";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import { nanoid } from "nanoid/non-secure";
import { DraftVideo } from "@/types/session";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type DraftImage = {
  id: string;
  uri: string;
  isLoading?: boolean;
};

export default function SettingsScreen() {
  const { t } = useTranslation(["weight", "common"]);
  const now = formatDateShort(new Date());
  const [weight, setWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState(`${t("weight.defaultTitle")} - ${now}`);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [draftVideos, setDraftVideos] = useState<DraftVideo[]>([]);
  const [draftRecordings, setDraftRecordings] = useState<DraftRecording[]>([]);

  // useWeightDraft hook to save draft weight
  useWeightDraft({
    title,
    notes,
    weight,
    draftRecordings,
    draftImages,
    draftVideos,
    setTitle,
    setNotes,
    setWeight,
    setDraftRecordings,
    setDraftImages,
    setDraftVideos,
  });

  const resetWeight = async () => {
    await AsyncStorage.removeItem("weight_draft");
    setTitle("");
    setNotes("");
    setWeight("");
    setDraftImages([]);
    setDraftVideos([]);
    setDraftRecordings([]);
  };

  // useSaveWeight hook to save weight
  const { handleSaveWeight } = useSaveWeight({
    title,
    notes,
    weight,
    setIsSaving,
    setSavingProgress,
    resetWeight,
    draftImages,
    draftVideos,
    draftRecordings,
  });

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <PageContainer className="flex-col justify-between">
            <View className="gap-5">
              <AppText className="text-2xl text-center mb-5">
                {t("weight.weightTracker")}
              </AppText>
              <AppInput
                value={title}
                onChangeText={setTitle}
                label={t("weight.titleLabel")}
                placeholder={t("weight.titlePlaceholder")}
              />
              <SubNotesInput
                value={notes}
                setValue={setNotes}
                label={t("weight.notesLabel")}
                placeholder={t("weight.notesPlaceholder")}
                maxLength={5000}
              />
              <AppInput
                value={weight}
                onChangeText={(v) => setWeight(v.replace(",", "."))}
                label={t("weight.weightLabel")}
                placeholder={t("weight.weightPlaceholder")}
                keyboardType="numeric"
              />
              {draftRecordings.length > 0 && (
                <View>
                  {draftRecordings.map((recording, index) => (
                    <DraftRecordingItem
                      key={recording.id}
                      uri={recording.uri}
                      durationMs={recording.durationMs}
                      deleteRecording={() =>
                        setDraftRecordings((prev) => prev.filter((_, i) => i !== index))
                      }
                    />
                  ))}
                </View>
              )}
              {draftImages.length > 0 && (
                <View>
                  {draftImages.map((image, index) => (
                    <DraftImageItem
                      key={image.id}
                      uri={image.uri}
                      isLoading={image.isLoading}
                      onDelete={() =>
                        setDraftImages((prev) => prev.filter((_, i) => i !== index))
                      }
                    />
                  ))}
                </View>
              )}
              {draftVideos.length > 0 && (
                <View>
                  {draftVideos.map((video, index) => (
                    <DraftVideoItem
                      key={video.id}
                      uri={video.uri}
                      thumbnailUri={video.thumbnailUri}
                      durationMs={video.durationMs}
                      isCompressing={video.isCompressing}
                      onDelete={() =>
                        setDraftVideos((prev) => prev.filter((_, i) => i !== index))
                      }
                    />
                  ))}
                </View>
              )}
              <MediaToolbar
                onRecordingComplete={(uri, durationMs) =>
                  setDraftRecordings((prev) => [
                    ...prev,
                    { id: nanoid(), uri, createdAt: Date.now(), durationMs },
                  ])
                }
                onImageSelected={(image) =>
                  setDraftImages((prev) => {
                    if (image.isLoading) {
                      return [...prev, image];
                    }
                    if (!image.uri) {
                      return prev.filter((img) => img.id !== image.id);
                    }
                    return prev.map((img) =>
                      img.id === image.id ? image : img,
                    );
                  })
                }
                onVideoSelected={(video) =>
                  setDraftVideos((prev) => {
                    if (prev.some((v) => v.id === video.id)) {
                      if (!video.uri) {
                        return prev.filter((v) => v.id !== video.id);
                      }
                      return prev.map((v) => v.id === video.id ? video : v);
                    }
                    return video.isCompressing ? [...prev, video] : prev;
                  })
                }
                currentImageCount={draftImages.length}
                currentVideoCount={draftVideos.length}
                currentVoiceCount={draftRecordings.length}
                folders={[]}
                selectedFolderId={null}
                onFolderSelect={() => {}}
                showFolderButton={false}
              />
            </View>

            <View className="flex-row gap-4 mt-6">
              <View className="flex-1">
                <DeleteButton onPress={resetWeight} />
              </View>
              <View className="flex-1">
                <SaveButton onPress={handleSaveWeight} />
              </View>
            </View>
          </PageContainer>
        </ScrollView>
      </TouchableWithoutFeedback>
      <FullScreenLoader
        visible={isSaving}
        message={savingProgress !== undefined ? t("common:common.media.uploading") : t("weight.savingWeight")}
        progress={savingProgress}
      />
    </>
  );
}

import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import AppText from "@/components/AppText";
import AppInput from "@/components/AppInput";
import { useState } from "react";
import NotesInput from "@/components/NotesInput";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageContainer from "@/components/PageContainer";
import useSaveDraft from "@/features/notes/hooks/useSaveDraft";
import useSaveNotes from "@/features/notes/hooks/useSaveNotes";
import { formatDateShort } from "@/lib/formatDate";
import RecordVoiceNotes from "@/features/notes/components/RecordVoiceNotes";
import { nanoid } from "nanoid/non-secure";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import { useConfirmAction } from "@/lib/confirmAction";
import { useTranslation } from "react-i18next";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

export default function NotesScreen() {
  const { t } = useTranslation("notes");
  const now = formatDateShort(new Date());
  const [title, setTitle] = useState(`${t("notes.title")} - ${now}`);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draftRecordings, setDraftRecordings] = useState<DraftRecording[]>([]);

  const confirmAction = useConfirmAction();

  const resetNote = () => {
    setTitle("");
    setNotes("");
    setDraftRecordings([]);
    AsyncStorage.removeItem("notes_draft");
  };

  // useSaveDraft hook to save draft notes
  useSaveDraft({
    title,
    notes,
    draftRecordings,
    setTitle,
    setNotes,
    setDraftRecordings,
  });

  // useSaveNotes hook to save notes
  const { handleSaveNotes } = useSaveNotes({
    title,
    notes,
    draftRecordings,
    setIsSaving,
    resetNote,
  });

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="justify-between">
          <View>
            <AppText className="text-2xl text-center mb-10">
              {t("notes.addNotesHere")}
            </AppText>
            <View className="mb-5">
              <AppInput
                value={title}
                setValue={setTitle}
                label={t("notes.titleLabel")}
                placeholder={t("notes.titlePlaceholder")}
              />
            </View>
            <NotesInput
              value={notes}
              setValue={setNotes}
              placeholder={t("notes.notesPlaceholder")}
              label={t("notes.notesLabel")}
            />
            {draftRecordings.length > 0 && (
              <View className="mt-5">
                <AppText className=" mb-2">{t("notes.recordings")}</AppText>
                {draftRecordings.map((recording, index) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.durationMs}
                    deleteRecording={async () => {
                      const confirm = await confirmAction({
                        title: t("notes.deleteRecordingTitle"),
                        message: t("notes.deleteRecordingMessage"),
                      });
                      if (!confirm) return;

                      setDraftRecordings((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                  />
                ))}
              </View>
            )}
            <View className="mt-6">
              <RecordVoiceNotes
                onRecordingComplete={(uri, duration) => {
                  const newRecording = {
                    id: nanoid(),
                    uri,
                    createdAt: Date.now(),
                    durationMs: duration,
                  };
                  setDraftRecordings((prev) => [...prev, newRecording]);
                }}
              />
            </View>
          </View>

          <View className="mt-10 flex-col gap-4">
            <SaveButton onPress={handleSaveNotes} />
            <DeleteButton onPress={resetNote} />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message={t("notes.savingNotes")} />
    </ScrollView>
  );
}

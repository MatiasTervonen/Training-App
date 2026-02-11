import { ScrollView, View } from "react-native";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";
import AppInput from "@/components/AppInput";
import NotesInput from "@/components/NotesInput";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import RecordVoiceNotes from "@/features/notes/components/RecordVoiceNotes";
import type { SetStateAction } from "react";
import { nanoid } from "nanoid/non-secure";
import { useConfirmAction } from "@/lib/confirmAction";
import { DraftRecording } from "@/types/session";
import FullScreenModal from "@/components/FullScreenModal";
import PageContainer from "@/components/PageContainer";

type NotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  title: string;
  setTitle: (title: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  draftRecordings: DraftRecording[];
  setDraftRecordings: (value: SetStateAction<DraftRecording[]>) => void;
};

export default function NotesModal({
  isOpen,
  onClose,
  activityName,
  title,
  setTitle,
  notes,
  setNotes,
  draftRecordings,
  setDraftRecordings,
}: NotesModalProps) {
  const { t } = useTranslation("activities");

  const confirmAction = useConfirmAction();

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageContainer className="pt-10">
          <AppText className="text-2xl mb-6 text-center">
            {activityName}
          </AppText>
          <AppInput
            label={t("activities.startActivityScreen.sessionNameLabel")}
            value={title}
            setValue={setTitle}
            placeholder={t(
              "activities.startActivityScreen.sessionNamePlaceholder",
            )}
          />
          <View className="mt-5">
            <NotesInput
              label={t("activities.startActivityScreen.sessionNotesLabel")}
              value={notes}
              setValue={setNotes}
              placeholder={t(
                "activities.startActivityScreen.sessionNotesPlaceholder",
              )}
            />
          </View>

          {draftRecordings.length > 0 && (
            <View className="mt-5">
              <AppText className="mb-2">{t("notes:notes.recordings")}</AppText>
              {draftRecordings.map((recording, index) => (
                <DraftRecordingItem
                  key={recording.id}
                  uri={recording.uri}
                  durationMs={recording.durationMs}
                  deleteRecording={async () => {
                    const confirm = await confirmAction({
                      title: t("notes:notes.deleteRecordingTitle"),
                      message: t("notes:notes.deleteRecordingMessage"),
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

          <View className="mt-5">
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

          <View className="h-10" />
        </PageContainer>
      </ScrollView>
    </FullScreenModal>
  );
}

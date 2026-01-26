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
import useSaveDraft from "@/Features/notes/hooks/useSaveDraft";
import useSaveNotes from "@/Features/notes/hooks/useSaveNotes";
import { formatDate } from "@/lib/formatDate";
import RecordVoiceNotes from "@/Features/notes/components/RecordVoiceNotes";
import { nanoid } from "nanoid/non-secure";
import { DraftRecordingItem } from "@/Features/notes/components/draftRecording";
import { confirmAction } from "@/lib/confirmAction";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

export default function NotesScreen() {
  const now = formatDate(new Date());
  const [title, setTitle] = useState(`Notes - ${now}`);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draftRecordings, setDraftRecordings] = useState<DraftRecording[]>([]);

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
              Add your notes here
            </AppText>
            <View className="mb-5">
              <AppInput
                value={title}
                setValue={setTitle}
                label="Title.."
                placeholder="Notes title...(optional)"
              />
            </View>
            <NotesInput
              className="min-h-[120px]"
              value={notes}
              setValue={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
            {draftRecordings.length > 0 && (
              <View className="mt-5">
                <AppText className=" mb-2">Recordings:</AppText>
                {draftRecordings.map((recording, index) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.durationMs}
                    deleteRecording={async () => {
                      const confirm = await confirmAction({
                        title: "Delete Recording",
                        message:
                          "Are you sure you want to delete this recording?",
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
      <FullScreenLoader visible={isSaving} message="Saving your notes..." />
    </ScrollView>
  );
}

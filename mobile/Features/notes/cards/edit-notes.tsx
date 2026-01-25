import { useState, useEffect } from "react";
import NotesInput from "@/components/NotesInput";
import AppInput from "@/components/AppInput";
import SaveButton from "@/components/buttons/SaveButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { editNotes } from "@/database/notes/edit-notes";
import PageContainer from "@/components/PageContainer";
import { Dot } from "lucide-react-native";
import { FeedItemUI } from "@/types/session";
import { FullNotesSession } from "@/database/notes/get-full-notes";
import { DraftRecordingItem } from "../components/draftRecording";
import RecordVoiceNotes from "../components/RecordVoiceNotes";
import { nanoid } from "nanoid/non-secure";
import { confirmAction } from "@/lib/confirmAction";
import { NotesVoiceSkeleton } from "@/components/skeletetons";

type Props = {
  note: FeedItemUI;
  onClose: () => void;
  onSave: (updateFeedItem: FeedItemUI) => void;
  voiceRecordings?: FullNotesSession | null;
  isLoadingVoice?: boolean;
};

type notesPayload = {
  notes: string;
  "voice-count"?: number;
};

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type ExistingRecording = {
  id: string;
  storage_path: string;
  duration_ms: number | null;
  uri: string;
};

export default function EditNotes({
  note,
  onClose,
  onSave,
  voiceRecordings,
  isLoadingVoice = false,
}: Props) {
  const payload = note.extra_fields as unknown as notesPayload;
  const voiceCount = payload["voice-count"] ?? 0;

  const [title, setValue] = useState(note.title);
  const [notes, setNotes] = useState(payload.notes);
  const [isSaving, setIsSaving] = useState(false);

  // Voice recordings state - initialize from props
  const [existingRecordings, setExistingRecordings] = useState<
    ExistingRecording[]
  >([]);
  const [deletedRecordingIds, setDeletedRecordingIds] = useState<string[]>([]);
  const [newRecordings, setNewRecordings] = useState<DraftRecording[]>([]);

  const initialTitle = note.title || "";
  const initialNotes = payload.notes || "";

  // Sync existing recordings from props
  useEffect(() => {
    if (voiceRecordings?.voiceRecordings) {
      setExistingRecordings(voiceRecordings.voiceRecordings);
    }
  }, [voiceRecordings]);

  const handleDeleteExisting = async (recordingId: string) => {
    const confirmed = await confirmAction({
      title: "Delete Recording",
      message: "Are you sure you want to delete this recording?",
    });
    if (!confirmed) return;

    setDeletedRecordingIds((prev) => [...prev, recordingId]);
    setExistingRecordings((prev) => prev.filter((r) => r.id !== recordingId));
  };

  const handleDeleteNew = async (index: number) => {
    const confirmed = await confirmAction({
      title: "Delete Recording",
      message: "Are you sure you want to delete this recording?",
    });
    if (!confirmed) return;

    setNewRecordings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const updatedFeedItem = await editNotes({
        id: note.source_id,
        title,
        notes,
        updated_at: new Date().toISOString(),
        deletedRecordingIds,
        newRecordings,
      });

      onSave(updatedFeedItem);
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: "Error editing notes",
        text2: "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    title !== initialTitle ||
    notes !== initialNotes ||
    deletedRecordingIds.length > 0 ||
    newRecordings.length > 0;

  return (
    <View className="flex-1">
      {hasChanges && (
        <View className="bg-gray-900 absolute top-5 left-5 z-50 py-1 px-4 flex-row items-center rounded-lg">
          <AppText className="text-sm text-yellow-500">
            {hasChanges ? "unsaved changes" : ""}
          </AppText>
          <View className="animate-pulse">
            <Dot color="#eab308" />
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <PageContainer className="mb-5">
            <AppText className="text-xl text-center mt-5 mb-10">
              Edit your notes
            </AppText>
            <View className="mb-5">
              <AppInput
                value={title || ""}
                onChangeText={setValue}
                placeholder="Notes title..."
                label="Title..."
              />
            </View>
            <View>
              <NotesInput
                className="min-h-[120px]"
                value={notes || ""}
                setValue={setNotes}
                placeholder="Write your notes here..."
                label="Notes..."
              />
            </View>

            {/* Existing Voice Recordings */}
            {(voiceCount > 0 ||
              existingRecordings.length > 0 ||
              newRecordings.length > 0) && (
              <View className="mt-6">
                <AppText className="text-lg mb-2">Voice Recordings:</AppText>
                {isLoadingVoice ? (
                  <NotesVoiceSkeleton count={voiceCount} />
                ) : (
                  existingRecordings.map((recording) => (
                    <DraftRecordingItem
                      key={recording.id}
                      uri={recording.uri}
                      durationMs={recording.duration_ms ?? undefined}
                      deleteRecording={() => handleDeleteExisting(recording.id)}
                    />
                  ))
                )}
              </View>
            )}

            {/* New Voice Recordings */}
            {newRecordings.length > 0 && (
              <View>
                {newRecordings.map((recording, index) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.durationMs}
                    deleteRecording={() => handleDeleteNew(index)}
                  />
                ))}
              </View>
            )}

            {/* Record New Voice Note */}
            <View className="mt-6">
              <RecordVoiceNotes
                onRecordingComplete={(uri, duration) => {
                  const newRecording = {
                    id: nanoid(),
                    uri,
                    createdAt: Date.now(),
                    durationMs: duration,
                  };
                  setNewRecordings((prev) => [...prev, newRecording]);
                }}
              />
            </View>
          </PageContainer>
        </TouchableWithoutFeedback>
      </ScrollView>
      <View className="px-5 pb-10 pt-3">
        <SaveButton
          disabled={!hasChanges}
          onPress={handleSubmit}
          label={!hasChanges ? "Save" : "Save Changes"}
        />
      </View>
      <FullScreenLoader visible={isSaving} message="Saving notes..." />
    </View>
  );
}

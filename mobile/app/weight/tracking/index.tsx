import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "@/components/AppText";
import SaveButton from "@/components/buttons/SaveButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import FullScreenLoader from "@/components/FullScreenLoader";
import AppInput from "@/components/AppInput";
import { useState } from "react";
import { formatDate } from "@/lib/formatDate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PageContainer from "@/components/PageContainer";
import SubNotesInput from "@/components/SubNotesInput";
import useWeightDraft from "@/Features/weight/hooks/useDraft";
import useSaveWeight from "@/Features/weight/hooks/useSaveWeight";

export default function SettingsScreen() {
  const now = formatDate(new Date());
  const [weight, setWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState(`Weight - ${now}`);

  // useWeightDraft hook to save draft weight
  useWeightDraft({
    title,
    notes,
    weight,
    setTitle,
    setNotes,
    setWeight,
  });

  const resetWeight = async () => {
    await AsyncStorage.removeItem("weight_draft");
    setTitle("");
    setNotes("");
    setWeight("");
  };

  // useSaveWeight hook to save weight
  const { handleSaveWeight } = useSaveWeight({
    title,
    notes,
    weight,
    setIsSaving,
    resetWeight,
  });

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <PageContainer className="flex-col justify-between">
          <View className="gap-5">
            <AppText className="text-2xl text-center mb-5">
              Weight Tracker
            </AppText>
            <AppInput
              value={title}
              onChangeText={setTitle}
              label="Title for Weight..."
              placeholder="Weight entry title..."
            />
            <SubNotesInput
              value={notes}
              setValue={setNotes}
              className="min-h-[60px]"
              label="Enter your notes here..."
              placeholder="Enter your notes here...(optional)"
            />
            <AppInput
              value={weight}
              onChangeText={setWeight}
              label="Enter your weight..."
              placeholder="Enter your weight here..."
              keyboardType="numeric"
            />
          </View>

          <View className="gap-5">
            <SaveButton onPress={handleSaveWeight} />
            <DeleteButton onPress={resetWeight} />
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message="Saving weight..." />
    </>
  );
}

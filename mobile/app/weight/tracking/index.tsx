import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
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

export default function SettingsScreen() {
  const { t } = useTranslation("weight");
  const now = formatDateShort(new Date());
  const [weight, setWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState(`${t("weight.defaultTitle")} - ${now}`);

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
              onChangeText={setWeight}
              label={t("weight.weightLabel")}
              placeholder={t("weight.weightPlaceholder")}
              keyboardType="numeric"
            />
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <DeleteButton onPress={resetWeight} />
            </View>
            <View className="flex-1">
              <SaveButton onPress={handleSaveWeight} />
            </View>
          </View>
        </PageContainer>
      </TouchableWithoutFeedback>
      <FullScreenLoader visible={isSaving} message={t("weight.savingWeight")} />
    </>
  );
}

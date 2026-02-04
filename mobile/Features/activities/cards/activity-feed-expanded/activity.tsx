import { FullActivitySession } from "@/types/models";
import { View, ScrollView, Modal } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { formatDate, formatTime, formatDuration } from "@/lib/formatDate";
import { useState } from "react";
import { useFullScreenModalConfig } from "@/lib/stores/fullScreenModalConfig";
import Map from "./components/map";
import SessionStats from "./components/sessionStats";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppInput from "@/components/AppInput";
import SubNotesInput from "@/components/SubNotesInput";
import FullScreenLoader from "@/components/FullScreenLoader";
import useSaveTemplate from "./hooks/useSaveTemplate";
import { useTranslation } from "react-i18next";

export default function ActivitySession(activity_session: FullActivitySession) {
  const { t } = useTranslation("activities");
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateNotes, setTemplateNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(
    activity_session.session.template_id,
  );

  const setSwipeEnabled = useFullScreenModalConfig(
    (state) => state.setSwipeEnabled,
  );

  const hasRoute = activity_session.route !== null;

  // hook to save the activity as a template
  const { saveAsTemplate } = useSaveTemplate({
    templateName,
    templateNotes,
    sessionId: activity_session.session.id,
    setIsSaving,
    setShowModal,
    setTemplateName,
    setTemplateNotes,
    onSuccess: (templateId) => setSavedTemplateId(templateId),
  });

  return (
    <ScrollView
      scrollEnabled={scrollEnabled}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <PageContainer className="mb-5">
        <View className="flex-1 justify-between">
          <View>
            <AppText className="text-gray-300 text-center text-sm">
              {formatDate(activity_session.session.created_at!)}
            </AppText>
            <LinearGradient
              colors={["#1e3a8a", "#0f172a", "#0f172a"]}
              start={{ x: 1, y: 0 }} // bottom-left
              end={{ x: 0, y: 1 }} // top-right
              className="items-center p-5 rounded-lg overflow-hidden shadow-md mt-5"
            >
              <AppText className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
                {activity_session.session.title}
              </AppText>

              <AppText className="text-lg text-center">
                {formatTime(activity_session.session.start_time)} -{" "}
                {formatTime(activity_session.session.end_time)}
              </AppText>
              {activity_session.session.notes && (
                <AppText className="text-lg text-left mt-5">
                  {activity_session.session.notes}
                </AppText>
              )}
              {!hasRoute && (
                <AppText className="text-lg text-center mt-5">
                  {t("activities.sessionDetails.duration")}:{" "}
                  {formatDuration(activity_session.session.duration)}
                </AppText>
              )}
              {!hasRoute && !!activity_session.stats?.steps && (
                <AppText className="text-lg text-center mt-5">
                  {t("activities.sessionDetails.steps")}:{" "}
                  {activity_session.stats?.steps}
                </AppText>
              )}
            </LinearGradient>
            {hasRoute && (
              <View className="mt-10">
                <Map
                  activity_session={activity_session}
                  setScrollEnabled={setScrollEnabled}
                  setSwipeEnabled={setSwipeEnabled}
                />
                <SessionStats activity_session={activity_session} />
              </View>
            )}
          </View>
          {hasRoute && savedTemplateId === null && (
            <View className="mt-10">
              <AnimatedButton
                onPress={() => setShowModal(true)}
                label={t("activities.sessionDetails.saveAsTemplate")}
                className="bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500"
                textClassName="text-gray-100 text-center"
              />
            </View>
          )}
        </View>
      </PageContainer>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
            <AppText className="text-xl mb-6 text-center">
              {t("activities.sessionDetails.saveAsTemplate")}
            </AppText>
            <AppText className="text-lg mb-6 text-center">
              {t("activities.sessionDetails.saveAsTemplateDesc")}
            </AppText>
            <AppInput
              value={templateName}
              setValue={setTemplateName}
              placeholder={t(
                "activities.sessionDetails.templateNamePlaceholder",
              )}
              label={t("activities.sessionDetails.templateNameLabel")}
            />
            <View className="mt-5">
              <SubNotesInput
                value={templateNotes}
                setValue={setTemplateNotes}
                placeholder={t(
                  "activities.sessionDetails.templateNotesPlaceholder",
                )}
                label={t("activities.sessionDetails.templateNotesLabel")}
                className="min-h-[60px]"
              />
            </View>
            <View className="flex-row gap-3 w-full mt-10">
              <View className="flex-1">
                <AnimatedButton
                  onPress={() => setShowModal(false)}
                  label={t("activities.sessionDetails.cancel")}
                  className="bg-red-800 py-2 my-3 rounded-md shadow-md border-2 border-red-500"
                  textClassName="text-gray-100 text-center"
                />
              </View>
              <View className="flex-1">
                <AnimatedButton
                  onPress={saveAsTemplate}
                  label={t("activities.sessionDetails.save")}
                  className="bg-blue-800 py-2 my-3 rounded-md shadow-md border-2 border-blue-500"
                  textClassName="text-gray-100 text-center"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <FullScreenLoader
        visible={isSaving}
        message={t("activities.sessionDetails.savingTemplate")}
      />
    </ScrollView>
  );
}

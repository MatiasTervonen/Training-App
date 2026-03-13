import { FullActivitySession } from "@/types/models";
import { View, ScrollView, Modal } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import PageContainer from "@/components/PageContainer";
import { formatDateShort, formatTime } from "@/lib/formatDate";
import { useState } from "react";
import Map from "./components/map";
import SessionStats from "./components/sessionStats";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppInput from "@/components/AppInput";
import SubNotesInput from "@/components/SubNotesInput";
import FullScreenLoader from "@/components/FullScreenLoader";
import useSaveTemplate from "./hooks/useSaveTemplate";
import { useTranslation } from "react-i18next";
import { History, Share2 } from "lucide-react-native";
import ActivityShareModal from "@/features/activities/components/share/ActivityShareModal";
import FullScreenMapModal from "./components/fullScreenMap";
import { ActivityVoiceRecording } from "@/database/activities/get-activity-voice-recordings";
import { ActivitySessionMedia } from "@/database/activities/get-activity-session-media";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import { NotesVoiceSkeleton } from "@/components/skeletetons";
import { useTemplateHistory } from "@/features/activities/templates/hooks/useTemplateHistory";
import TemplateHistoryModal from "@/features/activities/templates/components/TemplateHistoryModal";

type ActivitySessionProps = FullActivitySession & {
  voiceRecordings?: ActivityVoiceRecording[];
  isLoadingVoice?: boolean;
  voiceError?: unknown;
  media?: ActivitySessionMedia;
  isLoadingMedia?: boolean;
  mediaError?: unknown;
};

export default function ActivitySession(
  activity_session: ActivitySessionProps,
) {
  const { t } = useTranslation("activities");
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateNotes, setTemplateNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const hasRoute = activity_session.route !== null;
  const hasTemplate = !!activity_session.session.template_id;

  const {
    history,
    historyError,
    isLoadingHistory,
    isHistoryOpen,
    historyTemplateName,
    openHistory,
    closeHistory,
  } = useTemplateHistory();

  // hook to save the activity as a template
  const { saveAsTemplate } = useSaveTemplate({
    templateName,
    templateNotes,
    sessionId: activity_session.session.id,
    setIsSaving,
    setShowModal,
    setTemplateName,
    setTemplateNotes,
  });

  return (
    <ScrollView
      scrollEnabled={scrollEnabled}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <PageContainer>
        <View className="flex-1 justify-between">
          <View>
            <LinearGradient
              colors={["#1e3a8a", "#0f172a", "#0f172a"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="items-center p-5 rounded-lg overflow-hidden shadow-md mt-5"
            >
              <View className="flex-row items-center justify-center mb-2">
                <AppText className="text-xl text-center flex-1">
                  {activity_session.session.title}
                </AppText>
                <View className="flex-row items-center gap-4">
                  {hasTemplate && (
                    <AnimatedButton
                      onPress={() =>
                        openHistory(
                          activity_session.session.template_id!,
                          activity_session.session.title,
                        )
                      }
                      hitSlop={10}
                    >
                      <History color="#9ca3af" size={20} />
                    </AnimatedButton>
                  )}
                  <AnimatedButton
                    onPress={() => setIsShareModalOpen(true)}
                    hitSlop={10}
                  >
                    <Share2 color="#9ca3af" size={20} />
                  </AnimatedButton>
                </View>
              </View>

              <AppText className="text-sm text-gray-400" numberOfLines={1}>
                {formatDateShort(activity_session.session.start_time)}  ·  {formatTime(activity_session.session.start_time)} – {formatTime(activity_session.session.end_time)}
              </AppText>
              {activity_session.session.notes && (
                <BodyText className="text-left mt-5">
                  {activity_session.session.notes}
                </BodyText>
              )}
            </LinearGradient>
            {hasRoute && (
              <View className="mt-10">
                <Map
                  activity_session={activity_session}
                  setScrollEnabled={setScrollEnabled}
                  setFullScreen={setFullScreen}
                />
              </View>
            )}
            <SessionStats
              activity_session={activity_session}
              hasRoute={hasRoute}
            />

            {activity_session.voiceRecordings &&
              activity_session.voiceRecordings.length > 0 && (
                <View className="mt-10">
                  <AppText className="mb-3">
                    {t("activities.sessionDetails.recordings")}
                  </AppText>
                  {activity_session.voiceRecordings.map((recording) => (
                    <DraftRecordingItem
                      key={recording.id}
                      uri={recording.uri}
                      durationMs={recording.duration_ms ?? undefined}
                    />
                  ))}
                </View>
              )}

            {activity_session.isLoadingVoice && (
              <View className="mt-10">
                <NotesVoiceSkeleton />
              </View>
            )}

            {!!activity_session.voiceError && (
              <AppText className="text-center text-red-500 mt-10">
                {t("activities.sessionDetails.voiceLoadError")}
              </AppText>
            )}

            {/* Images */}
            {activity_session.media &&
              activity_session.media.images.length > 0 && (
                <View className="mt-10">
                  {activity_session.media.images.map((image, idx) => (
                    <DraftImageItem
                      key={image.id}
                      uri={image.uri}
                      onPress={() => setViewerIndex(idx)}
                    />
                  ))}
                </View>
              )}

            {/* Videos */}
            {activity_session.media &&
              activity_session.media.videos.length > 0 && (
                <View className="mt-6">
                  {activity_session.media.videos.map((video) => (
                    <DraftVideoItem
                      key={video.id}
                      uri={video.uri}
                      thumbnailUri={video.thumbnailUri}
                      durationMs={video.duration_ms ?? undefined}
                    />
                  ))}
                </View>
              )}

            {activity_session.isLoadingMedia && (
              <View className="mt-10">
                <NotesVoiceSkeleton />
              </View>
            )}

            {!!activity_session.mediaError && (
              <AppText className="text-center text-red-500 mt-10">
                {t("activities.sessionDetails.mediaLoadError")}
              </AppText>
            )}
          </View>
          {hasRoute && (
            <View className="mt-20">
              <AnimatedButton
                onPress={() => setShowModal(true)}
                label={t("activities.sessionDetails.saveAsTemplate")}
                className="btn-base"
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
              />
            </View>
            <View className="flex-row gap-3 w-full mt-10">
              <View className="flex-1">
                <AnimatedButton
                  onPress={() => setShowModal(false)}
                  label={t("activities.sessionDetails.cancel")}
                  className="btn-danger"
                  textClassName="text-gray-100 text-center"
                />
              </View>
              <View className="flex-1">
                <AnimatedButton
                  onPress={saveAsTemplate}
                  label={t("activities.sessionDetails.save")}
                  className="btn-base"
                  textClassName="text-gray-100 text-center"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      {hasRoute && (
        <FullScreenMapModal
          activity_session={activity_session}
          fullScreen={fullScreen}
          setFullScreen={setFullScreen}
          hasRoute={hasRoute}
        />
      )}
      <FullScreenLoader
        visible={isSaving}
        message={t("activities.sessionDetails.savingTemplate")}
      />
      <ActivityShareModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activitySession={activity_session}
      />
      <TemplateHistoryModal
        isOpen={isHistoryOpen}
        onClose={closeHistory}
        isLoading={isLoadingHistory}
        history={Array.isArray(history) ? history : []}
        templateName={historyTemplateName}
        error={historyError ? historyError.message : null}
      />
      {activity_session.media &&
        activity_session.media.images.length > 0 &&
        viewerIndex >= 0 && (
          <ImageViewerModal
            images={activity_session.media.images}
            initialIndex={viewerIndex}
            visible={viewerIndex >= 0}
            onClose={() => setViewerIndex(-1)}
          />
        )}
    </ScrollView>
  );
}

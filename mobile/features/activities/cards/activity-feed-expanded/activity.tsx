import { FullActivitySession } from "@/types/models";
import { View, ScrollView, Modal, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useFullScreenModalScroll } from "@/components/FullScreenModal";
import AppText from "@/components/AppText";
import ErrorMessage from "@/components/ErrorMessage";
import BodyText from "@/components/BodyText";
import PageContainer from "@/components/PageContainer";
import { formatDateShort, formatTime } from "@/lib/formatDate";
import { useState } from "react";
import Map from "./components/map";
import SessionStats from "./components/sessionStats";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedButton from "@/components/buttons/animatedButton";
import SaveButton from "@/components/buttons/SaveButton";
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
import { NotesVoiceSkeleton, NotesImageSkeleton } from "@/components/skeletetons";
import { useTemplateHistory } from "@/features/activities/templates/hooks/useTemplateHistory";
import TemplateHistoryModal from "@/features/activities/templates/components/TemplateHistoryModal";
import ShareWithFriendsButton from "@/features/social-feed/components/ShareWithFriendsToggle";
import AppTextNC from "@/components/AppTextNC";

type ActivitySessionProps = FullActivitySession & {
  voiceRecordings?: ActivityVoiceRecording[];
  isLoadingVoice?: boolean;
  voiceError?: unknown;
  media?: ActivitySessionMedia;
  isLoadingMedia?: boolean;
  mediaError?: unknown;
  readOnly?: boolean;
};

export default function ActivitySession(
  activity_session: ActivitySessionProps,
) {
  const { t } = useTranslation("activities");
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const modalScroll = useFullScreenModalScroll();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (modalScroll) {
      modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
    }
  };
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
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <PageContainer>
        <View className="flex-1 justify-between">
          <View>
            <LinearGradient
              colors={["#1e3a8a", "#0f172a", "#0f172a"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="items-center p-5 rounded-lg overflow-hidden shadow-md mt-1"
            >
              <AppText className="text-xl text-center w-full mb-4">
                {activity_session.session.title}
              </AppText>

              <AppTextNC className="text-sm text-gray-400" numberOfLines={1}>
                {formatDateShort(activity_session.session.start_time)} ·{" "}
                {formatTime(activity_session.session.start_time)} –{" "}
                {formatTime(activity_session.session.end_time)}
              </AppTextNC>
              {activity_session.session.notes && (
                <BodyText className="text-left mt-5">
                  {activity_session.session.notes}
                </BodyText>
              )}
              {!activity_session.readOnly && (
                <View className="w-full flex-row justify-end items-center gap-4 mt-2">
                  <ShareWithFriendsButton
                    sourceId={activity_session.session.id}
                    sessionType="activity_sessions"
                  />
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
              <ErrorMessage message={t("activities.sessionDetails.voiceLoadError")} />
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
                <NotesImageSkeleton />
              </View>
            )}

            {!!activity_session.mediaError && (
              <ErrorMessage message={t("activities.sessionDetails.mediaLoadError")} />
            )}
          </View>
          {hasRoute && !activity_session.readOnly && (
            <View className="mt-20">
              <AnimatedButton
                onPress={() => setShowModal(true)}
                label={t("activities.sessionDetails.saveAsTemplate")}
                className="btn-save"
              />
            </View>
          )}
        </View>
      </PageContainer>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View
            className="bg-slate-900 rounded-xl p-6 w-full border-[1.5px] border-slate-600"
            style={{
              shadowColor: "#3b82f6",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            <AppText className="text-xl mb-6 text-center">
              {t("activities.sessionDetails.saveAsTemplate")}
            </AppText>
            <BodyText className="text-base mb-6 text-center">
              {t("activities.sessionDetails.saveAsTemplateDesc")}
            </BodyText>
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
                />
              </View>
              <View className="flex-1">
                <SaveButton
                  onPress={saveAsTemplate}
                  label={t("activities.sessionDetails.save")}
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

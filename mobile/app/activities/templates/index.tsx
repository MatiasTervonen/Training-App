import { useRouter } from "expo-router";
import FullScreenModal from "@/components/FullScreenModal";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { ScrollView, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteActivityTemplate } from "@/database/activities/delete-template";
import { confirmAction } from "@/lib/confirmAction";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useTimerStore } from "@/lib/stores/timerStore";
import { getActivityTemplates } from "@/database/activities/get-templates";
import { templateSummary } from "@/types/session";
import ActivityTemplateCard from "@/Features/activities/cards/template-card";
import ActivityTemplateExpanded from "@/Features/activities/cards/template-card-expanded";
import { getDatabase } from "@/database/local-database/database";
import { clearLocalSessionDatabase } from "@/Features/activities/lib/database-actions";
import { useStartGPStracking } from "@/Features/activities/lib/location-actions";

export default function TemplatesPage() {
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [expandedItem, setExpandedItem] = useState<templateSummary | null>(
    null
  );

  const activeSession = useTimerStore((state) => state.activeSession);
  const setActiveSession = useTimerStore((state) => state.setActiveSession);
  const startSession = useTimerStore((state) => state.startSession);
  const { startGPStracking } = useStartGPStracking();

  const queryClient = useQueryClient();

  const router = useRouter();

  const {
    data: templates = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-activity-templates"],
    queryFn: getActivityTemplates,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const startActivity = async (template: templateSummary) => {
    if (activeSession) {
      Toast.show({
        type: "error",
        text1: "You already have an active session.",
        text2: "Finish it before starting a new one.",
      });
      return;
    }

    setIsStartingWorkout(true);

    const sessionDraft = {
      title: template.template.name,
      notes: template.template.notes,
      activityName: template.activity.name,
    };

    await AsyncStorage.setItem("activity_draft", JSON.stringify(sessionDraft));

    const initializeDatabase = async () => {
      const db = await getDatabase();

      try {
        // First drop any leftover table from previous sessions
        await clearLocalSessionDatabase();

        // Then create fresh table for new session
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS gps_points (
            timestamp INTEGER NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            altitude REAL,
            accuracy REAL
          );
      `);

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS template_route (
            idx INTEGER NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL
          );
        `);

        template.route?.coordinates.forEach(async ([lng, lat], index) => {
          await db.runAsync(
            `INSERT INTO template_route (idx, latitude, longitude) VALUES (?, ?, ?)`,
            [index, lat, lng]
          );
        });

        return true;
      } catch (error) {
        console.error("Error initializing database", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to initialize database. Please try again.",
        });
        setIsStartingWorkout(false);
        return false;
      }
    };

    const ok = await initializeDatabase();

    if (!ok) return;

    setActiveSession({
      type: "activity",
      label: template.template.name,
      path: "/activities/start-activity",
      gpsAllowed: true,
      stepsAllowed: true,
      hasTemplateRoute: true,
    });

    await startGPStracking();

    startSession("Activity");
    router.push("/activities/start-activity");
    setIsStartingWorkout(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmDelete = await confirmAction({
      message: "Delete Template",
      title:
        "Are you sure you want to delete this template? This action cannot be undone.",
    });
    if (!confirmDelete) return;

    const queryKey = ["get-activity-templates"];

    const previousTemplates =
      queryClient.getQueryData<templateSummary[]>(queryKey);

    queryClient.setQueryData<templateSummary[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return oldData.filter((item) => item.template.id !== templateId);
    });

    try {
      await deleteActivityTemplate(templateId);

      Toast.show({
        type: "success",
        text1: "Template deleted successfully",
      });

      queryClient.refetchQueries({ queryKey: ["fullActivitySession"] });
    } catch {
      queryClient.setQueryData(queryKey, previousTemplates);
      Toast.show({
        type: "error",
        text1: "Failed to delete template",
        text2: "Please try again.",
      });
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PageContainer>
        <AppText className="text-center mb-10 text-2xl">My Templates</AppText>

        {!error && isLoading && <TemplateSkeleton count={6} />}

        {error && (
          <View className="bg-slate-900 rounded-md py-10 px-10 items-center justify-center">
            <AppText className="text-red-500 text-center text-lg">
              Error loading templates. Try again!
            </AppText>
          </View>
        )}

        {!isLoading && templates.length === 0 && (
          <View className="bg-slate-900 rounded-md py-10 px-10 items-center justify-center gap-2">
            <AppText className="text-gray-300 text-lg">
              No templates found.
            </AppText>
            <AppText className="text-gray-300 text-lg">
              Create a new template to get started!
            </AppText>
          </View>
        )}

        {templates &&
          templates.map((template: templateSummary, index: number) => (
            <ActivityTemplateCard
              index={index}
              key={template.template.id}
              item={template}
              onDelete={() => handleDeleteTemplate(template.template.id)}
              onExpand={() => setExpandedItem(template)}
              onEdit={() => {
                router.push(`/gym/templates/${template.template.id}`);
              }}
            />
          ))}

        {expandedItem && (
          <FullScreenModal isOpen={true} onClose={() => setExpandedItem(null)}>
            <ActivityTemplateExpanded
              item={expandedItem}
              onStartWorkout={() => startActivity(expandedItem)}
              isStartingWorkout={isStartingWorkout}
            />
          </FullScreenModal>
        )}
      </PageContainer>
    </ScrollView>
  );
}

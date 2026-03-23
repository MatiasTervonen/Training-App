import { templateSummary } from "@/types/session";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "@/database/local-database/database";
import { clearLocalSessionDatabase } from "@/features/activities/lib/database-actions";
import {
  useStartGPStracking,
  useStopGPStracking,
} from "../../lib/location-actions";
import { startStepSession } from "@/native/android/NativeStepCounter";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useUserStore } from "@/lib/stores/useUserStore";
import { useTranslation } from "react-i18next";

export function useStartActivity() {
  const activeSession = useTimerStore((state) => state.activeSession);
  const setActiveSession = useTimerStore((state) => state.setActiveSession);
  const startSession = useTimerStore((state) => state.startSession);
  const { t } = useTranslation(["activities", "common"]);
  const gpsEnabledGlobally = useUserStore(
    (state) => state.settings?.gps_tracking_enabled,
  );
  const { startGPStracking } = useStartGPStracking();
  const { stopGPStracking } = useStopGPStracking();
  const router = useRouter();
  const [isStartingActivity, setIsStartingActivity] = useState(false);
  const [showGpsModal, setShowGpsModal] = useState(false);

  const startActivity = async (template: templateSummary) => {
    if (activeSession) {
      Toast.show({
        type: "error",
        text1: t("activities:activities.activeSessionError"),
        text2: t("activities:activities.activeSessionErrorSub"),
      });
      return;
    }

    // If GPS is disabled globally, show modal directing user to settings
    if (!gpsEnabledGlobally) {
      setShowGpsModal(true);
      return;
    }

    setIsStartingActivity(true);

    const sessionDraft = {
      title: template.template.name,
      notes: template.template.notes,
      activityName: template.activity.name,
      activityId: template.activity.id,
      activitySlug: template.activity.slug ?? null,
      baseMet: template.activity.base_met,
      templateId: template.template.id,
      isGpsRelevant: template.activity.is_gps_relevant,
      isStepRelevant: template.activity.is_step_relevant,
      isCaloriesRelevant: template.activity.is_calories_relevant,
    };

    await Promise.all([
      AsyncStorage.setItem("activity_draft", JSON.stringify(sessionDraft)),
      stopGPStracking(),
    ]);

    // Always clear old GPS data first to avoid loading stale points
    await clearLocalSessionDatabase();

    const initializeDatabase = async () => {
      const db = await getDatabase();

      try {
        // Create fresh table for new session
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS gps_points (
            timestamp INTEGER NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            altitude REAL,
            accuracy REAL,
            is_stationary INTEGER DEFAULT 0,
            confidence INTEGER DEFAULT 0,
            bad_signal INTEGER DEFAULT 0
          );
      `);

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS template_route (
            idx INTEGER NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL
          );
        `);

        if (template.route?.coordinates) {
          for (let index = 0; index < template.route.coordinates.length; index++) {
            const [lng, lat] = template.route.coordinates[index];
            await db.runAsync(
              `INSERT INTO template_route (idx, latitude, longitude) VALUES (?, ?, ?)`,
              [index, lat, lng],
            );
          }
        }

        return true;
      } catch (error) {
        console.error("Error initializing database", error);
        Toast.show({
          type: "error",
          text1: t("common:common.error"),
          text2: t("activities:activities.dbInitError"),
        });
        setIsStartingActivity(false);
        return false;
      }
    };

    const ok = await initializeDatabase();

    if (!ok) return;

    // Reset native step counter baseline before setActiveSession,
    // otherwise useLiveStepCounter picks up stale steps from the previous session
    await startStepSession();

    setActiveSession({
      type: template.activity.name,
      label: template.template.name,
      path: "/activities/start-activity",
      gpsAllowed: true,
      stepsAllowed: true,
      hasTemplateRoute: true,
    });

    await startGPStracking();

    startSession(template.activity.name);
    router.push("/activities/start-activity");
    setIsStartingActivity(false);
  };

  return {
    startActivity,
    isStartingActivity,
    showGpsModal,
    dismissGpsModal: () => setShowGpsModal(false),
  };
}

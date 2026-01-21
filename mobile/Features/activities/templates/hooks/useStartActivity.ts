import { templateSummary } from "@/types/session";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "@/database/local-database/database";
import { clearLocalSessionDatabase } from "@/Features/activities/lib/database-actions";
import { useStartGPStracking } from "../../lib/location-actions";
import { useState } from "react";
import { useRouter } from "expo-router";


export function useStartActivity() {
    const activeSession = useTimerStore((state) => state.activeSession);
    const setActiveSession = useTimerStore((state) => state.setActiveSession);
    const startSession = useTimerStore((state) => state.startSession);
    const { startGPStracking } = useStartGPStracking();
    const router = useRouter();
    const [isStartingActivity, setIsStartingActivity] = useState(false);


    const startActivity = async (template: templateSummary) => {
        if (activeSession) {
            Toast.show({
                type: "error",
                text1: "You already have an active session.",
                text2: "Finish it before starting a new one.",
            });
            return;
        }

        setIsStartingActivity(true);

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
            accuracy REAL,
             is_stationary INTEGER DEFAULT 0
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
                setIsStartingActivity(false);
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
        setIsStartingActivity(false);
    };

    return {
        startActivity,
        isStartingActivity,
    };
}
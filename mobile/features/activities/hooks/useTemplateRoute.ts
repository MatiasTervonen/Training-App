import { useEffect, useState } from "react";
import { getDatabase } from "@/database/local-database/database";
import { handleError } from "@/utils/handleError";
import { useTimerStore } from "@/lib/stores/timerStore";

export function useTemplateRoute() {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [isLoadingTemplateRoute, setIsLoadingTemplateRoute] = useState(false);
  const activeSession = useTimerStore((state) => state.activeSession);

  useEffect(() => {
    // Only load template route if session was started from a template
    if (!activeSession?.hasTemplateRoute) {
      setRoute([]);
      return;
    }

    const loadRoute = async () => {
      try {
        setIsLoadingTemplateRoute(true);
        const db = await getDatabase();

        const rows = await db.getAllAsync<{
          latitude: number;
          longitude: number;
        }>("SELECT latitude, longitude FROM template_route ORDER BY idx ASC");

        setRoute(rows.map((row) => [row.longitude, row.latitude]));
      } catch (error) {
        handleError(error, {
          message: "Error loading template route",
          route: "/features/activities/hooks/useTemplateRoute",
          method: "loadRoute",
        });
      } finally {
        setIsLoadingTemplateRoute(false);
      }
    };
    loadRoute();
  }, [activeSession?.hasTemplateRoute]);

  return {
    route,
    setRoute,
    isLoadingTemplateRoute,
  };
}

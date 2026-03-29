import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivitySessionSummary } from "@/lib/stores/activitySessionSummaryStore";
import {
  getAvailableStats,
  getDefaultSelectedKeys,
} from "@/features/activities/lib/activityShareCardUtils";

type UseActivityShareStatsOptions = {
  summary: ActivitySessionSummary | null;
  visible?: boolean;
};

export default function useActivityShareStats({
  summary,
  visible,
}: UseActivityShareStatsOptions) {
  const { t } = useTranslation("activities");

  const availableStats = useMemo(
    () => (summary ? getAvailableStats(summary, t) : []),
    [summary, t],
  );

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() =>
    getDefaultSelectedKeys(availableStats),
  );

  // Reset selected keys when modal opens
  useEffect(() => {
    if (visible !== undefined) {
      if (visible) {
        setSelectedKeys(getDefaultSelectedKeys(availableStats));
      }
      return;
    }
    // Page mode: update when stats become available
    if (availableStats.length > 0 && selectedKeys.size === 0) {
      setSelectedKeys(getDefaultSelectedKeys(availableStats));
    }
  }, [visible, availableStats, selectedKeys.size]);

  const selectedStats = useMemo(
    () => availableStats.filter((s) => selectedKeys.has(s.key)),
    [availableStats, selectedKeys],
  );

  const handleToggle = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  return {
    availableStats,
    selectedKeys,
    selectedStats,
    handleToggle,
  };
}

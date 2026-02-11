import { useState, useCallback } from "react";
import { View, ScrollView, Pressable } from "react-native";
import AppText from "@/components/AppText";
import { Bug, X, Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { getLogEvents, getLogText, forceFlush } from "../lib/debugLogger";
import { getDatabase } from "@/database/local-database/database";

type DebugOverlayProps = {
  trackLength: number;
  isHydrated: boolean;
  isGpsWarmingUp: boolean;
};

export default function DebugOverlay({
  trackLength,
  isHydrated,
  isGpsWarmingUp,
}: DebugOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dbCount, setDbCount] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setRefreshKey((k) => k + 1);
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM gps_points",
      );
      setDbCount(result?.count ?? 0);
    } catch {
      setDbCount(-1);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    await forceFlush();
    const text = getLogText();
    await Clipboard.setStringAsync(text);
    Toast.show({ type: "success", text1: "Log copied to clipboard" });
  }, []);

  if (!isOpen) {
    return (
      <Pressable
        onPress={handleOpen}
        className="absolute z-50 p-2 rounded-full bg-gray-800/80 border border-gray-600"
        style={{ bottom: 15, left: 15 }}
        hitSlop={10}
      >
        <Bug size={20} color="#9ca3af" />
      </Pressable>
    );
  }

  const events = getLogEvents();

  return (
    <View
      className="absolute z-50 bg-gray-900/95 rounded-lg border border-gray-700"
      style={{ top: 10, left: 10, right: 10, bottom: 80, maxHeight: 500 }}
    >
      <View className="flex-row items-center justify-between px-3 py-2 border-b border-gray-700">
        <AppText className="text-sm font-bold text-gray-300">
          Debug Log
        </AppText>
        <View className="flex-row gap-3">
          <Pressable onPress={() => setRefreshKey((k) => k + 1)} hitSlop={10}>
            <AppText className="text-xs text-blue-400">Refresh</AppText>
          </Pressable>
          <Pressable onPress={handleCopy} hitSlop={10}>
            <Copy size={18} color="#60a5fa" />
          </Pressable>
          <Pressable onPress={() => setIsOpen(false)} hitSlop={10}>
            <X size={18} color="#9ca3af" />
          </Pressable>
        </View>
      </View>

      <View className="flex-row gap-3 px-3 py-1.5 border-b border-gray-800">
        <AppText className="text-xs text-gray-400">
          track: {trackLength}
        </AppText>
        <AppText className="text-xs text-gray-400">
          db: {dbCount ?? "?"}
        </AppText>
        <AppText
          className={`text-xs ${isHydrated ? "text-green-400" : "text-red-400"}`}
        >
          {isHydrated ? "hydrated" : "not hydrated"}
        </AppText>
        {isGpsWarmingUp && (
          <AppText className="text-xs text-yellow-400">warming up</AppText>
        )}
      </View>

      <ScrollView className="flex-1 px-2 py-1">
        {events.length === 0 ? (
          <AppText className="text-xs text-gray-500 py-2">
            No events yet
          </AppText>
        ) : (
          [...events].reverse().map((event, i) => (
            <View key={`${refreshKey}-${i}`} className="py-0.5">
              <AppText className="text-[10px] text-gray-400" numberOfLines={2}>
                <AppText className="text-[10px] text-gray-500">
                  {event.time}
                </AppText>{" "}
                <AppText className="text-[10px] text-blue-400">
                  [{event.tag}]
                </AppText>{" "}
                {event.message}
              </AppText>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

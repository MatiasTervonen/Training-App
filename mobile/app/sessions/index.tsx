import AppText from "@/components/AppText";
import {
  NotebookPen,
  Dumbbell,
  Timer,
  Weight,
  Bell,
  ListTodo,
  Activity,
  CalendarCheck,
  FileBarChart,
  Utensils,
  LucideIcon,
} from "lucide-react-native";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import DraggableList from "@/components/DraggableList";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { LinkProps } from "expo-router";
import { SESSION_COLORS, SessionColors } from "@/lib/sessionColors";

const STORAGE_KEY = "sessions-order";

type SessionItem = {
  id: string;
  labelKey: string;
  href: LinkProps["href"];
  icon: LucideIcon;
  colors: SessionColors;
};

const DEFAULT_ITEMS: SessionItem[] = [
  { id: "gym", labelKey: "sessions.gym", href: "/gym", icon: Dumbbell, colors: SESSION_COLORS.gym },
  { id: "activities", labelKey: "sessions.activities", href: "/activities", icon: Activity, colors: SESSION_COLORS.activities },
  { id: "notes", labelKey: "sessions.notes", href: "/notes", icon: NotebookPen, colors: SESSION_COLORS.notes },
  { id: "timer", labelKey: "sessions.timer", href: "/timer", icon: Timer, colors: SESSION_COLORS.timer },
  { id: "weight", labelKey: "sessions.bodyWeight", href: "/weight", icon: Weight, colors: SESSION_COLORS.weight },
  { id: "todo", labelKey: "sessions.todoList", href: "/todo", icon: ListTodo, colors: SESSION_COLORS.todo },
  { id: "reminders", labelKey: "sessions.reminders", href: "/reminders", icon: Bell, colors: SESSION_COLORS.reminders },
  { id: "habits", labelKey: "sessions.habits", href: "/habits", icon: CalendarCheck, colors: SESSION_COLORS.habits },
  { id: "reports", labelKey: "sessions.reports", href: "/reports", icon: FileBarChart, colors: SESSION_COLORS.reports },
  { id: "nutrition", labelKey: "sessions.nutrition", href: "/nutrition", icon: Utensils, colors: SESSION_COLORS.nutrition },
];

function sortByOrder(order: string[]): SessionItem[] {
  const map = new Map(DEFAULT_ITEMS.map((item) => [item.id, item]));
  const sorted: SessionItem[] = [];

  for (const id of order) {
    const item = map.get(id);
    if (item) {
      sorted.push(item);
      map.delete(id);
    }
  }

  // Append any new items not in the saved order
  for (const item of map.values()) {
    sorted.push(item);
  }

  return sorted;
}

export default function SessionsScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState(DEFAULT_ITEMS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        const order: string[] = JSON.parse(stored);
        setItems(sortByOrder(order));
      }
    });
  }, []);

  const handleReorder = useCallback((newItems: SessionItem[]) => {
    setItems(newItems);
    const order = newItems.map((item) => item.id);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }, []);

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">{t("sessions.title")}</AppText>
      <DraggableList
        items={items}
        onReorder={handleReorder}
        keyExtractor={(item) => item.id}
        renderItem={(item) => {
          const Icon = item.icon;
          return (
            <View className="mb-4">
              <LinkButton
                label={t(item.labelKey)}
                href={item.href}
                gradientColors={item.colors.gradient}
                borderColor={item.colors.border}
              >
                <Icon size={20} color={item.colors.icon} />
              </LinkButton>
            </View>
          );
        }}
      />
    </PageContainer>
  );
}

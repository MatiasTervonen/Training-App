import { View, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useFullScreenModalScroll } from "@/components/FullScreenModal";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  ArrowLeftRight,
  Dumbbell,
  Activity,
  Scale,
  NotebookPen,
  Bell,
  Repeat,
  ListTodo,
  MessageCircle,
  FileBarChart,
  Utensils,
  ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import BodyTextNC from "@/components/BodyTextNC";
import AppTextNC from "@/components/AppTextNC";
import { APP_NAME } from "@/lib/app-config";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useRouter } from "expo-router";

type TutorialFeature = {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  titleKey: string;
  descKey: string;
  route: string;
};

const TUTORIAL_FEATURES: TutorialFeature[] = [
  {
    icon: Dumbbell,
    color: "#3b82f6",
    bgColor: "bg-blue-900/40",
    titleKey: "feed.tutorial.gym.title",
    descKey: "feed.tutorial.gym.desc",
    route: "/gym",
  },
  {
    icon: Activity,
    color: "#22c55e",
    bgColor: "bg-green-900/40",
    titleKey: "feed.tutorial.activities.title",
    descKey: "feed.tutorial.activities.desc",
    route: "/activities",
  },
  {
    icon: Utensils,
    color: "#ff00ff",
    bgColor: "bg-fuchsia-900/40",
    titleKey: "feed.tutorial.nutrition.title",
    descKey: "feed.tutorial.nutrition.desc",
    route: "/nutrition",
  },
  {
    icon: Scale,
    color: "#f59e0b",
    bgColor: "bg-amber-900/40",
    titleKey: "feed.tutorial.weight.title",
    descKey: "feed.tutorial.weight.desc",
    route: "/weight",
  },
  {
    icon: NotebookPen,
    color: "#a855f7",
    bgColor: "bg-purple-900/40",
    titleKey: "feed.tutorial.notes.title",
    descKey: "feed.tutorial.notes.desc",
    route: "/notes",
  },
  {
    icon: Bell,
    color: "#ec4899",
    bgColor: "bg-pink-900/40",
    titleKey: "feed.tutorial.reminders.title",
    descKey: "feed.tutorial.reminders.desc",
    route: "/reminders",
  },
  {
    icon: Repeat,
    color: "#f43f5e",
    bgColor: "bg-rose-900/40",
    titleKey: "feed.tutorial.habits.title",
    descKey: "feed.tutorial.habits.desc",
    route: "/habits",
  },
  {
    icon: ListTodo,
    color: "#06b6d4",
    bgColor: "bg-cyan-900/40",
    titleKey: "feed.tutorial.todo.title",
    descKey: "feed.tutorial.todo.desc",
    route: "/todo",
  },
  {
    icon: MessageCircle,
    color: "#06b6d4",
    bgColor: "bg-cyan-900/40",
    titleKey: "feed.tutorial.chat.title",
    descKey: "feed.tutorial.chat.desc",
    route: "/chat",
  },
  {
    icon: FileBarChart,
    color: "#6366f1",
    bgColor: "bg-indigo-900/40",
    titleKey: "feed.tutorial.reports.title",
    descKey: "feed.tutorial.reports.desc",
    route: "/reports",
  },
];

interface TutorialSessionProps {
  onClose?: () => void;
}

export default function TutorialSession({ onClose }: TutorialSessionProps) {
  const { t } = useTranslation("feed");
  const modalScroll = useFullScreenModalScroll();
  const router = useRouter();

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (modalScroll) {
      modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
    }
  };

  const handleFeaturePress = (route: string) => {
    onClose?.();
    router.push(route as never);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16}>
      <PageContainer className="mb-10">
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-blue-900 items-center justify-center mb-4">
            <BookOpen size={32} color="#93c5fd" />
          </View>
          <AppText className="text-2xl text-center">
            {t("feed.tutorial.title", { appName: APP_NAME })}
          </AppText>
          <BodyTextNC className="text-gray-400 text-center mt-2">
            {t("feed.tutorial.subtitle", { appName: APP_NAME })}
          </BodyTextNC>

          <View className="flex-row items-center mt-4 bg-slate-800 rounded-lg px-4 py-3 border border-slate-700">
            <ArrowLeftRight size={18} color="#94a3b8" />
            <BodyTextNC className="text-sm text-gray-400 ml-3 flex-1">
              {t("feed.tutorial.navigation_hint")}
            </BodyTextNC>
          </View>
        </View>

        <View className="gap-3 pb-10">
          {TUTORIAL_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <AnimatedButton
                key={feature.titleKey}
                onPress={() => handleFeaturePress(feature.route)}
                className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex-row items-center"
              >
                <View className={`w-11 h-11 rounded-full ${feature.bgColor} items-center justify-center`}>
                  <Icon size={22} color={feature.color} />
                </View>
                <View className="flex-1 ml-3 mr-2">
                  <AppTextNC className="text-base text-gray-100">
                    {t(feature.titleKey)}
                  </AppTextNC>
                  <BodyTextNC className="text-xs text-gray-400 mt-0.5">
                    {t(feature.descKey)}
                  </BodyTextNC>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </AnimatedButton>
            );
          })}
        </View>
      </PageContainer>
    </ScrollView>
  );
}

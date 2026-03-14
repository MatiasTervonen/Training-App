import { View, ScrollView, Image } from "react-native";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const TUTORIAL_IMAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/tutorial-images`;

const TUTORIAL_SECTIONS = [
  {
    image: `${TUTORIAL_IMAGE_BASE}/gym-tracking.webp`,
    titleKey: "feed.tutorial.gym.title",
    descKey: "feed.tutorial.gym.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/activities.webp`,
    titleKey: "feed.tutorial.activities.title",
    descKey: "feed.tutorial.activities.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/weight.webp`,
    titleKey: "feed.tutorial.weight.title",
    descKey: "feed.tutorial.weight.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/notes.webp`,
    titleKey: "feed.tutorial.notes.title",
    descKey: "feed.tutorial.notes.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/reminders.webp`,
    titleKey: "feed.tutorial.reminders.title",
    descKey: "feed.tutorial.reminders.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/habits.webp`,
    titleKey: "feed.tutorial.habits.title",
    descKey: "feed.tutorial.habits.desc",
  },
  {
    image: `${TUTORIAL_IMAGE_BASE}/todo.webp`,
    titleKey: "feed.tutorial.todo.title",
    descKey: "feed.tutorial.todo.desc",
  },
];

export default function TutorialSession() {
  const { t } = useTranslation("feed");

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <PageContainer className="mb-10">
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-blue-900 items-center justify-center mb-4">
            <BookOpen size={32} color="#93c5fd" />
          </View>
          <AppText className="text-2xl text-center">
            {t("feed.tutorial.title")}
          </AppText>
          <AppText className="text-gray-400 text-center mt-2">
            {t("feed.tutorial.subtitle")}
          </AppText>
        </View>

        <View className="gap-6 pb-10">
          {TUTORIAL_SECTIONS.map((section) => (
            <View
              key={section.titleKey}
              className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
            >
              <Image
                source={{ uri: section.image }}
                className="w-full h-48"
                resizeMode="cover"
              />
              <View className="p-4">
                <AppText className="text-lg mb-2">
                  {t(section.titleKey)}
                </AppText>
                <AppText className="text-sm text-gray-400 leading-5">
                  {t(section.descKey)}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </PageContainer>
    </ScrollView>
  );
}

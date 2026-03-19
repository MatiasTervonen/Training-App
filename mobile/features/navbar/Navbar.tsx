import { usePathname, Link } from "expo-router";
import { View, Pressable } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import { MessageCircle } from "lucide-react-native";
import { Image } from "expo-image";
import { useUserStore } from "@/lib/stores/useUserStore";
import NotificationBell from "@/features/navbar/notificationBell";
import useTotalUnreadCount from "@/features/chat/hooks/useTotalUnreadCount";
import { LinearGradient } from "expo-linear-gradient";
import ActiveSessionPopup from "@/components/ActiveSessionPopup";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const profilePictureRaw = useUserStore(
    (state) => state.profile?.profile_picture || null,
  );

  const { data: unreadCount } = useTotalUnreadCount();

  if (pathname === "/login" || pathname === "/" || pathname === "/onboarding")
    return null; // Don't render the navbar on the login page

  return (
    <>
      <LinearGradient
        colors={["#1e3a8a", "#0f172a", "#0f172a"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="w-full p-4 flex flex-row items-center justify-between bg-slate-950"
      >
        <Link href="/dashboard" asChild>
          <Pressable>
            <Image
              source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded.svg")}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
          </Pressable>
        </Link>
        <View className="flex-row items-center gap-3">
          <NotificationBell />
          <Link href="/chat" asChild>
            <Pressable className="w-[40px] h-[40px] rounded-full border-2 border-blue-500 items-center justify-center bg-slate-800">
              <MessageCircle color="white" size={20} />
              {!!unreadCount && unreadCount > 0 && (
                <View className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center z-50">
                  <AppText className="text-[10px] font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </AppText>
                </View>
              )}
            </Pressable>
          </Link>
          <Link href="/menu" asChild>
            <Pressable className="w-[40px] h-[40px] rounded-full border-2 border-blue-500 items-center justify-center">
              <Image
                source={
                  profilePictureRaw
                    ? { uri: profilePictureRaw }
                    : require("@/assets/images/default-avatar.png")
                }
                alt="Profile Picture"
                className="w-full h-full rounded-full overflow-hidden"
              />
            </Pressable>
          </Link>
        </View>
      </LinearGradient>
      {["/dashboard", "/menu", "/sessions"].includes(pathname) && (
        <View className="bg-slate-800">
          <View className="flex-row p-1 gap-2">
            <Link href="/menu" asChild>
              <Pressable
                className={`flex-1 py-2 px-3 rounded-md ${
                  pathname === "/menu" ? "bg-slate-700" : ""
                }`}
              >
                <AppTextNC className={`text-center font-medium ${
                  pathname === "/menu" ? "text-cyan-400" : "text-gray-200"
                }`}>{t("navbar.menu")}</AppTextNC>
              </Pressable>
            </Link>

            <Link href={"/dashboard"} asChild>
              <Pressable
                className={`flex-1 py-2 px-3 rounded-md ${
                  pathname === "/dashboard" ? "bg-slate-700" : ""
                }`}
              >
                <AppTextNC className={`text-center font-medium ${
                  pathname === "/dashboard" ? "text-cyan-400" : "text-gray-200"
                }`}>{t("navbar.feed")}</AppTextNC>
              </Pressable>
            </Link>

            <Link href="/sessions" asChild>
              <Pressable
                className={`flex-1 py-2 px-3 rounded-md ${
                  pathname === "/sessions" ? "bg-slate-700" : ""
                }`}
              >
                <AppTextNC className={`text-center font-medium ${
                  pathname === "/sessions" ? "text-cyan-400" : "text-gray-200"
                }`}>{t("navbar.sessions")}</AppTextNC>
              </Pressable>
            </Link>
          </View>
        </View>
      )}
      <ActiveSessionPopup />
    </>
  );
}

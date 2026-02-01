import { usePathname, Link } from "expo-router";
import { View, Pressable } from "react-native";
import AppText from "@/components/AppText";
import { MessageCircle } from "lucide-react-native";
import { Image } from "expo-image";
import { useUserStore } from "@/lib/stores/useUserStore";
import NotificationBell from "@/Features/navbar/notificationBell";
import { LinearGradient } from "expo-linear-gradient";
import ActiveSessionPopup from "@/components/ActiveSessionPopup";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const profilePictureRaw = useUserStore(
    (state) => state.profile?.profile_picture || null,
  );

  if (pathname === "/login" || pathname === "/") return null; // Don't render the navbar on the login page

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
            <AppText className="text-2xl pr-[1px]">MyTrack</AppText>
          </Pressable>
        </Link>
        <View className="flex-row items-center gap-3">
          <NotificationBell />
          <Link href="/chat" asChild>
            <Pressable className="w-[40px] h-[40px] rounded-full border-2 border-blue-500 items-center justify-center bg-slate-800">
              <MessageCircle color="white" size={20} />
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
        <View className="flex-row justify-between bg-slate-600 w-full text-center text-gray-100">
          <Link href="/menu" asChild>
            <Pressable
              className={
                pathname === "/menu"
                  ? "bg-slate-500 p-3 w-1/3 items-center"
                  : "p-3 w-1/3 items-center"
              }
            >
              <AppText className="pr-[1px]">{t("navbar.menu")}</AppText>
            </Pressable>
          </Link>

          <Link href={"/dashboard"} asChild>
            <Pressable
              className={
                pathname === "/dashboard"
                  ? "bg-slate-500 p-3 w-1/3 items-center"
                  : "p-3 w-1/3 items-center"
              }
            >
              <AppText className="pr-[1px]">{t("navbar.feed")}</AppText>
            </Pressable>
          </Link>
          <Link href="/sessions" asChild>
            <Pressable
              className={
                pathname === "/sessions"
                  ? "bg-slate-500 p-3 w-1/3 items-center"
                  : "p-3 w-1/3 items-center"
              }
            >
              <AppText className="pr-[1px]">{t("navbar.sessions")}</AppText>
            </Pressable>
          </Link>
        </View>
      )}
      <ActiveSessionPopup />
    </>
  );
}

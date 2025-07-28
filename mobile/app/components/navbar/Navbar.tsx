import { usePathname, Link } from "expo-router";
import { View, Pressable } from "react-native";
import AppText from "../AppText";
import { Bell, MessageCircle } from "lucide-react-native";
import { Image } from "expo-image";
import { useUserStore } from "@/lib/stores/useUserStore";

export default function Navbar() {
  const pathname = usePathname();

  const profilePictureRaw = useUserStore(
    (state) => state.preferences?.profile_picture || null
  );

  if (pathname === "/login" || pathname === "/") return null; // Don't render the navbar on the login page

  return (
    <>
      <View className="w-full p-4 flex flex-row items-center justify-between bg-slate-950">
        <Link href="/dashboard" asChild>
          <Pressable>
            <AppText className="text-2xl">MyTrack</AppText>
          </Pressable>
        </Link>
        <View className="flex-row items-center gap-3">
          <Bell color="white" />
          <Link
            href="/chat"
            className="border-2 p-2 border-blue-500 rounded-full bg-gray-800"
            asChild
          >
            <Pressable>
              <MessageCircle color="white" size={20} />
            </Pressable>
          </Link>
          <Link
            href="/menu"
            className="rounded-full border-2 border-blue-500 w-[40px] h-[40px]"
            asChild
          >
            <Pressable
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: "#3b82f6", // Tailwind's blue-500
                overflow: "hidden", // ensure Image/Skeleton are clipped
              }}
            >
              <Image
                source={
                  profilePictureRaw
                    ? { uri: profilePictureRaw }
                    : require("@/assets/images/default-avatar.png")
                }
                alt="Profile Picture"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 9999,
                }}
              />
            </Pressable>
          </Link>
        </View>
      </View>
      {["/dashboard", "/menu", "/sessions"].includes(pathname) && (
        <View className="flex-row justify-between bg-slate-600 w-full text-center text-gray-100">
          <Link
            href="/menu"
            className={
              pathname === "/menu"
                ? "bg-slate-500 p-2 w-1/3 items-center"
                : "p-2 w-1/3 items-center"
            }
            asChild
          >
            <Pressable>
              <AppText>Menu</AppText>
            </Pressable>
          </Link>

          <Link
            href={"/dashboard"}
            className={
              pathname === "/dashboard"
                ? "bg-slate-500 p-2 w-1/3 items-center"
                : "p-2 w-1/3 items-center"
            }
            asChild
          >
            <Pressable>
              <AppText>Feed</AppText>
            </Pressable>
          </Link>
          <Link
            href="/sessions"
            className={
              pathname === "/sessions"
                ? "bg-slate-500 p-2 w-1/3 items-center"
                : "p-2 w-1/3 items-center"
            }
            asChild
          >
            <Pressable>
              <AppText>Sessions</AppText>
            </Pressable>
          </Link>
        </View>
      )}
    </>
  );
}

import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";

export default function EmailVerified() {
  return (
    <View className="flex-1 justify-center items-center bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 px-2">
      <View className="items-center justify-center gap-10 max-w-xl border-2 py-10 px-5 sm:px-10 rounded-xl bg-slate-900 shadow-lg">
        <AppText className="text-2xl mb-4">MyTrack</AppText>
        <AppText className="text-center text-green-400">
          Email Verified Successfully
        </AppText>
        <AppText className="text-center text-slate-400">
          Your email has been successfully verified. You can now log in to your
          account.
        </AppText>
        <LinkButton href="/login" label="Log in" />
      </View>
    </View>
  );
}

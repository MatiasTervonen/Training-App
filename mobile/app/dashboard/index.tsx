import { View } from "react-native";
import AppText from "../components/AppText";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

export default function FeedScreen() {
  useEffect(() => {
    const fetchSession = async () => {
      const { data: session } = await supabase.auth.getSession();

      console.log("FeedScreen session data:", session);
    };

    fetchSession();
  }, []);

  return (
    <View>
      <AppText>Feed</AppText>
    </View>
  );
}

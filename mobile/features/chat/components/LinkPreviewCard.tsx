import { View, Linking, Image, Text } from "react-native";
import { Link2 } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import { LinkPreview } from "@/types/chat";

type LinkPreviewCardProps = {
  preview: LinkPreview;
  isOwn: boolean;
};

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinkPreviewCard({
  preview,
  isOwn,
}: LinkPreviewCardProps) {
  if (!preview.title && !preview.description && !preview.image) return null;

  const siteName = preview.site_name ?? getDomain(preview.url);
  const showSiteName =
    siteName.toLowerCase() !== (preview.title ?? "").toLowerCase();

  return (
    <AnimatedButton
      onPress={() => Linking.openURL(preview.url)}
      className={`mt-1.5 rounded-xl overflow-hidden ${
        isOwn ? "bg-blue-700/50" : "bg-slate-600/50"
      }`}
    >
      {preview.image && (
        <Image
          source={{ uri: preview.image }}
          className="w-full h-[140px]"
          resizeMode="cover"
        />
      )}
      <View className="px-3 py-2 gap-0.5">
        {preview.title && (
          <Text
            className="font-lexend text-[13px] leading-[17px] text-slate-100"
            numberOfLines={2}
          >
            {preview.title}
          </Text>
        )}
        {preview.description && (
          <Text
            className="font-lexend text-[11px] leading-[15px] text-slate-300"
            numberOfLines={4}
          >
            {preview.description}
          </Text>
        )}
        <View className="flex-row items-center gap-1 mt-0.5">
          <Link2 color="#cbd5e1" size={11} />
          <Text
            className="font-lexend text-[11px] leading-[15px] text-slate-300"
            numberOfLines={1}
          >
            {getDomain(preview.url)}
          </Text>
        </View>
      </View>
    </AnimatedButton>
  );
}

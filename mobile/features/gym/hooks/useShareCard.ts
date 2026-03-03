import { useRef, useState, useCallback } from "react";
import { View } from "react-native";
import { makeImageFromView, ImageFormat } from "@shopify/react-native-skia";
import { File as FSFile, Paths } from "expo-file-system";
import Share from "react-native-share";

export default function useShareCard() {
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareCard = useCallback(async (): Promise<boolean> => {
    if (!cardRef.current) return false;

    setIsSharing(true);
    try {
      const image = await makeImageFromView(cardRef);
      if (!image) return false;

      const base64 = image.encodeToBase64(ImageFormat.PNG);
      const filename = `workout-${Date.now()}.png`;
      const file = new FSFile(Paths.cache, filename);
      file.write(base64, { encoding: "base64" });

      await Share.open({
        url: file.uri,
        type: "image/png",
      });
      return true;
    } catch (error) {
      // react-native-share throws when user dismisses the share sheet
      if (
        error instanceof Error &&
        error.message?.includes("User did not share")
      ) {
        return true;
      }
      console.error(error);
      return false;
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { cardRef, isSharing, shareCard };
}

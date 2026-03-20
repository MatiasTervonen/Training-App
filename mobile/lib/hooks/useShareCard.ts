import { useRef, useState, useCallback } from "react";
import { View } from "react-native";
import { makeImageFromView, ImageFormat } from "@shopify/react-native-skia";
import { File as FSFile, Paths } from "expo-file-system";
import Share from "react-native-share";
import * as MediaLibrary from "expo-media-library";
import { ShareCardSize } from "@/lib/share/themes";

export default function useShareCard(filenamePrefix = "share-") {
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const captureCard = useCallback(async (size?: ShareCardSize): Promise<string | null> => {
    if (!cardRef.current) return null;

    const image = await makeImageFromView(cardRef);
    if (!image) return null;

    const base64 = image.encodeToBase64(ImageFormat.PNG);
    const filename = `${filenamePrefix}${Date.now()}.png`;
    const file = new FSFile(Paths.cache, filename);
    file.write(base64, { encoding: "base64" });

    return file.uri;
  }, [filenamePrefix]);

  const shareCard = useCallback(async (size?: ShareCardSize): Promise<boolean> => {
    setIsSharing(true);
    try {
      const uri = await captureCard(size);
      if (!uri) return false;

      await Share.open({ url: uri, type: "image/png" });
      return true;
    } catch (error) {
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
  }, [captureCard]);

  const saveCardToGallery = useCallback(async (size?: ShareCardSize): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return false;

      const uri = await captureCard(size);
      if (!uri) return false;

      await MediaLibrary.saveToLibraryAsync(uri);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [captureCard]);

  return { cardRef, isSharing, isSaving, shareCard, saveCardToGallery, captureCard };
}

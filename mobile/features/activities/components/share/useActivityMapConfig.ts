import { useState, useEffect, useMemo } from "react";
import { PixelRatio } from "react-native";
import { useActivitySettingsStore } from "@/lib/stores/activitySettingsStore";
import { MAP_STYLES, LINE_COLORS } from "@/features/activities/lib/mapConstants";
import { SHARE_CARD_DIMENSIONS, ShareCardSize } from "@/lib/share/themes";

type UseActivityMapConfigOptions = {
  size: ShareCardSize;
  visible?: boolean;
};

export default function useActivityMapConfig({
  size,
  visible,
}: UseActivityMapConfigOptions) {
  const globalMapStyleIndex = useActivitySettingsStore((s) => {
    const idx = MAP_STYLES.findIndex((m) => m.url === s.defaultMapStyle);
    return idx >= 0 ? idx : 0;
  });
  const globalLineColorIndex = useActivitySettingsStore(
    (s) => s.defaultLineColorIndex,
  );

  const [mapStyleIndex, setMapStyleIndex] = useState(globalMapStyleIndex);
  const [lineColorIndex, setLineColorIndex] = useState(globalLineColorIndex);
  const [hideMapDetails, setHideMapDetails] = useState(false);
  const [showGradient, setShowGradient] = useState(true);

  // Reset to global defaults when modal opens
  useEffect(() => {
    if (visible === undefined) return;
    if (visible) {
      setMapStyleIndex(globalMapStyleIndex);
      setLineColorIndex(globalLineColorIndex);
      setHideMapDetails(false);
      setShowGradient(true);
    }
  }, [visible, globalMapStyleIndex, globalLineColorIndex]);

  const lineColor = LINE_COLORS[lineColorIndex];
  const mapStyleUrl = MAP_STYLES[mapStyleIndex].url;

  const dims = useMemo(() => SHARE_CARD_DIMENSIONS[size], [size]);

  const pixelRatio = PixelRatio.get();
  const mapDims = useMemo(
    () => ({
      width: Math.round(dims.width / pixelRatio),
      height: Math.round(dims.height / pixelRatio),
    }),
    [dims, pixelRatio],
  );

  return {
    mapStyleIndex,
    setMapStyleIndex,
    lineColorIndex,
    setLineColorIndex,
    hideMapDetails,
    setHideMapDetails,
    showGradient,
    setShowGradient,
    lineColor,
    mapStyleUrl,
    dims,
    mapDims,
  };
}

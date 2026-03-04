import Mapbox from "@rnmapbox/maps";

export const MAP_STYLES = [
  { url: Mapbox.StyleURL.Dark, labelKey: "dark" },
  { url: Mapbox.StyleURL.SatelliteStreet, labelKey: "satellite" },
  { url: Mapbox.StyleURL.Street, labelKey: "street" },
];

export const LINE_COLORS = [
  { glow: "rgba(59,130,246,0.4)", core: "#3b82f6", labelKey: "blue" },
  { glow: "rgba(239,68,68,0.4)", core: "#ef4444", labelKey: "red" },
  { glow: "rgba(34,197,94,0.4)", core: "#22c55e", labelKey: "green" },
  { glow: "rgba(168,85,247,0.4)", core: "#a855f7", labelKey: "purple" },
  { glow: "rgba(234,179,8,0.4)", core: "#eab308", labelKey: "yellow" },
];

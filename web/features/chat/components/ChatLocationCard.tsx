"use client";

import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import Map, { Marker } from "react-map-gl/mapbox";
import type { LocationShareContent } from "@/types/chat";
import "mapbox-gl/dist/mapbox-gl.css";

type ChatLocationCardProps = {
  data: LocationShareContent;
};

export default function ChatLocationCard({ data }: ChatLocationCardProps) {
  const { t } = useTranslation("chat");

  const displayText =
    data.address ?? `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;

  const googleMapsUrl = `https://www.google.com/maps?q=${data.lat},${data.lng}`;

  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-[280px] rounded-xl overflow-hidden border border-slate-600/50 hover:border-cyan-500/50 transition-colors"
    >
      {/* Mini map */}
      <div className="h-[150px] w-full pointer-events-none">
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={{
            longitude: data.lng,
            latitude: data.lat,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          attributionControl={false}
          interactive={false}
        >
          <Marker longitude={data.lng} latitude={data.lat} anchor="bottom">
            <MapPin size={28} className="text-cyan-400" fill="rgba(6,182,212,0.3)" />
          </Marker>
        </Map>
      </div>

      {/* Info section */}
      <div className="bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 px-4 pt-3 pb-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <MapPin size={14} className="text-cyan-400 shrink-0" />
          <span className="font-body text-xs text-slate-400">
            {t("chat.locationCard.location")}
          </span>
        </div>
        <p className="font-body text-sm text-slate-200 truncate">{displayText}</p>
        <span className="font-body text-xs text-slate-500">
          {t("chat.locationCard.tapToView")}
        </span>
      </div>
    </a>
  );
}

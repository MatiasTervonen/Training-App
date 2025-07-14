import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyTrack",
    short_name: "MyTrack",
    description:
      "Track everything from gym workouts to Disc Golf rounds and personal goals. MyTrack helps you stay organized and motivated—your progress, your way.",
    theme_color: "#0f172a",
    background_color: "#0f172a",
    display: "standalone",
    start_url: "/login",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "Screenshot 1",
      },
      {
        src: "/screenshot-mobile.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Screenshot 2",
      },
    ],
  };
}

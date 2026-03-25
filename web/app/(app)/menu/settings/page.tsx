"use client";

import { PushNotificationManager } from "@/components/pushnotifications/pushnotifications";
import LanguageSelector from "@/components/LanguageSelector";
export default function SettingsPage() {
  return (
    <div className="page-padding max-w-md mx-auto flex flex-col">
      <div className="flex flex-col gap-5">
        <div className="bg-slate-900 p-4 rounded-md">
          <LanguageSelector />
        </div>
        <div className="bg-slate-900 p-4 rounded-md">
          <PushNotificationManager />
        </div>
      </div>
    </div>
  );
}

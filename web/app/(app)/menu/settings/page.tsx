import { PushNotificationManager } from "@/app/(app)/components/pushnotifications/pushnotifications";

export default function SettingsPage() {
  return (
    <div className="page-padding max-w-md mx-auto flex flex-col">
      <h1 className="text-2xl text-center mb-10">Settings</h1>
      <div className="flex flex-col gap-5">
        <div className="bg-slate-900 p-4 rounded-md">
          <PushNotificationManager />
        </div>
      </div>
    </div>
  );
}

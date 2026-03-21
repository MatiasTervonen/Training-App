import { APP_NAME } from "@/lib/app-config";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 py-6 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span>Made in Finland</span>
        <svg viewBox="0 0 36 24" width={28} height={19} className="shrink-0" aria-label="Finnish flag">
          <rect width="36" height="24" fill="#FFFFFF" rx="2" />
          <rect x="0" y="9.6" width="36" height="4.8" fill="#003580" />
          <rect x="10.8" y="0" width="4.8" height="24" fill="#003580" />
        </svg>
      </div>
      <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
    </footer>
  );
}

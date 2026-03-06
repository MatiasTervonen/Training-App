import { APP_NAME } from "@/lib/app-config";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 py-4 text-center text-gray-500 text-sm">
      &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
    </footer>
  );
}

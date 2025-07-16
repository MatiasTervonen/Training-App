import LayoutWrapper from "./ui/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import "../globals.css";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function appLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <LayoutWrapper>{children}</LayoutWrapper>
      <div className="fixed bottom-4 right-4 bg-indigo-600/80 hover:bg-indigo-700 backdrop-blur-md p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-100 z-[1000]">
        <Link href={"/chat"} className="flex items-center gap-2 text-gray-100">
          <MessageCircle size={24} />
          Chat
        </Link>
      </div>
    </div>
  );
}

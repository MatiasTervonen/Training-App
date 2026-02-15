import { Toaster } from "react-hot-toast";
import "../globals.css";
import UserLoader from "@/components/UserLoader";
import { Suspense } from "react";
import Navbar from "@/components/navbar/navbar";
import LayoutWrapper from "@/components/LayoutWrapper";
import SplashScreen from "@/components/SplashScreen";
import MenuSidebar from "@/components/sidebar/MenuSidebar";
import SessionsSidebar from "@/components/sidebar/SessionsSidebar";
import ActiveSessionPopup from "@/components/activeSessionPopup";

export default function appLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #334155",
          },
        }}
      />
      <SplashScreen>
        <Navbar />
        <div className="flex w-full max-w-[1600px] mx-auto">
          <div className="hidden xl:block xl:w-72 shrink-0 sticky top-[72px] h-[calc(100dvh-72px)] overflow-y-auto bg-slate-900 border-r border-slate-700">
            <MenuSidebar />
          </div>
          <div className="flex-1 min-w-0 lg:bg-slate-950">
            <div className="hidden lg:block sticky top-[72px] z-40">
              <ActiveSessionPopup />
            </div>
            <LayoutWrapper>{children}</LayoutWrapper>
          </div>
          <div className="hidden lg:block lg:w-64 xl:w-72 shrink-0 sticky top-[72px] h-[calc(100dvh-72px)] overflow-y-auto bg-slate-900 border-l border-slate-700">
            <SessionsSidebar />
          </div>
        </div>
      </SplashScreen>
      <Suspense fallback={null}>
        <UserLoader />
      </Suspense>
    </div>
  );
}

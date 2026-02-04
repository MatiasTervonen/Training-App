import { Toaster } from "react-hot-toast";
import "../globals.css";
import UserLoader from "@/app/(app)/components/UserLoader";
import { Suspense } from "react";
import Navbar from "@/app/(app)/components/navbar/navbar";
import LayoutWrapper from "@/app/(app)/components/LayoutWrapper";
import SplashScreen from "@/app/(app)/components/SplashScreen";

export default function appLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <SplashScreen>
        <Navbar />
        <LayoutWrapper>{children}</LayoutWrapper>
      </SplashScreen>
      <Suspense fallback={null}>
        <UserLoader />
      </Suspense>
    </div>
  );
}

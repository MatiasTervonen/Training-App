import { Toaster } from "react-hot-toast";
import "../globals.css";
import UserLoader from "./components/UserLoader";
import { Suspense } from "react";
import Navbar from "@/app/(app)/components/navbar/navbar";
import LayoutWrapper from "./components/LayoutWrapper";
import { Providers } from "./components/Providers";

export default function appLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <LayoutWrapper>
        <Providers>{children}</Providers>
      </LayoutWrapper>
      <Suspense fallback={null}>
        <UserLoader />
      </Suspense>
    </div>
  );
}

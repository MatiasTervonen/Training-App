import { Toaster } from "react-hot-toast";
import "../globals.css";
import UserLoader from "@/app/(app)/components/UserLoader";
import { Suspense } from "react";
import Navbar from "@/app/(app)/components/navbar/navbar";
import LayoutWrapper from "@/app/(app)/components/LayoutWrapper";

export default function appLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <LayoutWrapper>{children}</LayoutWrapper>
      <Suspense fallback={null}>
        <UserLoader />
      </Suspense>
    </div>
  );
}

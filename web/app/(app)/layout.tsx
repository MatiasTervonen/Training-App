import { Toaster } from "react-hot-toast";
import "../globals.css";
import UserLoader from "./components/UserLoader";
import { Suspense } from "react";
import Navbar from "@/app/(app)/components/navbar/navbar";

export default function appLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      {children}
      <Suspense fallback={null}>
        <UserLoader />
      </Suspense>
    </div>
  );
}

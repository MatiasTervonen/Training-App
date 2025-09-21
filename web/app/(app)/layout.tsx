import { Toaster } from "react-hot-toast";
import "../globals.css";
import Navbar from "@/app/(app)/components/navbar/navbar";
import UserLoader from "./components/UserLoader";
import { Suspense } from "react";

export default async function appLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

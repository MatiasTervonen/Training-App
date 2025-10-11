import ClientSearch from "./components/ClientSearch";
import { Suspense } from "react";
import Spinner from "@/app/(app)/components/spinner";

export default function ResetPassword() {
  return (
    <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 text-gray-100 text-lg px-2">
      <Suspense fallback={<Spinner size="h-10 w-10" />}>
        <ClientSearch />
      </Suspense>
    </div>
  );
}

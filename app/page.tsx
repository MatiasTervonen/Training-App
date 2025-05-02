import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { russoOne } from "./ui/fonts";
import GetSession from "@/lib/getSession";
import SessionFeed from "./ui/homepage/sessionFeed";
import Navbar from "./ui/homepage/navbar";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const { session } = await GetSession();

  //   const simulateError = true; // ← flip this to test
  // const { session, error } = simulateError ? { session: null, error: { message: "test" } } : await GetSession();

  return (
    <div className="bg-slate-900 min-h-screen w-full">
      {/* <div className="flex flex-col items-center justify-center pt-10">
        <h1 className="text-gray-100">Welcome back!</h1>
        <p className="text-gray-100">Hello, {data.user?.email}</p>
      </div> */}
      <div className="flex items-center justify-center"></div>
      <SessionFeed sessions={session} />
    </div>
  );
}

"use client";

import { russoOne } from "../ui/fonts";
import Link from "next/link";
import ModalPageWrapper from "../components/modalPageWrapper";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

export default function MenuPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const role = user.app_metadata?.role;
        if (role === "admin" || role === "super_admin") {
          setIsAdmin(true);
        }
      }
    };
    checkRole();
  }, [supabase.auth]);

  return (
    <ModalPageWrapper
      onSwipeRight={() => router.back()}
      leftLabel="back"
      onSwipeLeft={() => router.push("/")}
      rightLabel="home"
    >
      <div
        className={`${russoOne.className} h-full bg-slate-800 text-gray-100  px-5 pt-10`}
      >
        <h1 className="text-2xl text-center mb-5">Menu</h1>
        <div className="flex flex-col max-w-md mx-auto ">
          <Link
            className={`${russoOne.className} text-center  bg-blue-800 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
            href={"/settings"}
          >
            Settings
          </Link>
          {isAdmin && (
            <Link
              className={`${russoOne.className} text-center bg-blue-800 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
              href={"/admin"}
            >
              Admin panel
            </Link>
          )}
        </div>
      </div>
    </ModalPageWrapper>
  );
}

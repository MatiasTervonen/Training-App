"use client";

import LinkButton from "@/app/(app)/ui/LinkButton";
import { useUserStore } from "../../lib/stores/useUserStore";

export default function MenuContext() {
  const role = useUserStore((state) => state.role);
  const isAdmin = role === "admin" || role === "super_admin";

  return <>{isAdmin && <LinkButton href={"/admin"}>Admin panel</LinkButton>}</>;
}

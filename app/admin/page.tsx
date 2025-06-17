import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminClient from "./adminClient";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is not authenticated, redirect to the login page
  if (!user) {
    return redirect("/login");
  }

  const role = user.user_metadata?.role;

  if (!role || (role !== "admin" && role !== "super_admin")) {
    return redirect("/");
  }

  return <AdminClient isAdmin={true} />;
}

import { redirect } from "next/navigation";
import { checkAdmin } from "@/app/(app)/database/admin/check-is-admin";
import LinkButton from "../components/buttons/LinkButton";

export default async function AdminPage() {
  const { user, role } = await checkAdmin();

  if (!user) redirect("/login");

  if (!role || (role !== "admin" && role !== "super_admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto page-padding">
      <h1 className="text-2xl mb-10 text-center">Admin panel</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href={"/admin/user-analytics"}>user analytics</LinkButton>
        <LinkButton href={"/admin/add-exercises"}>add exercises</LinkButton>
        <LinkButton href={"/admin/edit-exercises"}>edit exercises</LinkButton>
      </div>
    </div>
  );
}

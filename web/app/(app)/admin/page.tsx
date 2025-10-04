import { redirect } from "next/navigation";
import { checkAdmin } from "@/app/(app)/lib/data";
import LinkButton from "../ui/LinkButton";

export default async function AdminPage() {
  const { user, role } = await checkAdmin();

  if (!user) redirect("/login");

  if (!role || (role !== "admin" && role !== "super_admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="h-full bg-slate-800 text-gray-100 px-5 pt-5">
      <h1 className="text-2xl my-5 text-center">Admin panel</h1>
      <div className="flex flex-col gap-5 max-w-md mx-auto">
        <LinkButton href={"/admin/user-analytics"}>user analytics</LinkButton>
        <LinkButton href={"/admin/add-exercises"}>add exercises</LinkButton>
        <LinkButton href={"/admin/edit-exercises"}>edit exercises</LinkButton>
      </div>
    </div>
  );
}

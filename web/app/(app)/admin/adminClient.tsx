import Link from "next/link";
import ModalPageWrapper from "../components/modalPageWrapper";

export default function AdminClient() {
  return (
    <ModalPageWrapper noTopPadding>
      <div className="h-full bg-slate-800 text-gray-100 px-5 pt-5">
        <h1 className="text-2xl my-5 text-center">Admin panel</h1>
        <div className="flex flex-col max-w-md mx-auto">
          <Link
            href={"/admin/user-analytics"}
            className="flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
          >
            user analytics
          </Link>
          <Link
            href={"/admin/add-exercises"}
            className="flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
          >
            add exercises
          </Link>
          <Link
            href={"/admin/edit-exercises"}
            className="flex items-center justify-center gap-2 bg-blue-800 py-2 w-full my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
          >
            edit exercises
          </Link>
        </div>
      </div>
    </ModalPageWrapper>
  );
}

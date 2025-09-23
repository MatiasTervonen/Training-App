import Link from "next/link";
import ModalPageWrapper from "../components/modalPageWrapper";

export default function TrainingPage() {
  return (
    <ModalPageWrapper>
      <div className="h-full bg-slate-800 text-gray-100 p-5">
        <h1 className="text-2xl my-5 text-center">Gym Session</h1>
        <div className="flex flex-col max-w-md mx-auto">
          <Link
            className="text-center  bg-blue-800 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
            href={"/training/gym"}
          >
            Start empty workout
          </Link>
          <Link
            className="text-center bg-blue-800 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
            href={"/training/create-template"}
          >
            Create template
          </Link>
          <Link
            className="text-center bg-blue-800 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
            href={"/training/templates"}
          >
            Templates
          </Link>
          <Link
            className="text-center bg-blue-800 py-2 my-3 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
            href={"/training/workout-analytics"}
          >
            Workout Analytics
          </Link>
        </div>
      </div>
    </ModalPageWrapper>
  );
}

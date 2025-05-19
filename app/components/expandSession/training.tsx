import { Session, Exercise } from "@/types/session";
import { formatDate } from "@/lib/formatDate";

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function TrainingSession({ session }: { session: Session }) {
  return (
    <div>
      <div className="my-5 flex flex-col gap-2 justify-center items-center">
        <div className="text-sm text-gray-400">
          {formatDate(session.created_at)}
        </div>
        <h2 className="text-xl font-semibold mt-2">{session.title}</h2>
        <h3 className="font-semibold mt-2">
          Duration: {formatDuration(session.duration)}
        </h3>
        <p className="mt-4 text-gray-200 whitespace-pre-wrap break-words overflow-hidden max-w-full">
          {session.notes}
        </p>
      </div>
      {session.exercises?.map((exercise: Exercise, index: number) => (
        <div
          key={index}
          className="mt-6 bg-slate-800 rounded-md px-4 py-2 shadow-lg mx-4"
        >
          <h3 className="text-lg font-bold text-gray-100 border-b mb-2">
            {exercise.name}
          </h3>
          <div className="py-2 whitespace-pre-wrap break-words overflow-hidden max-w-full">
            {exercise.notes}
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-300">
                <th className="p-2 border-b">Set</th>
                <th className="p-2 border-b">Weight</th>
                <th className="p-2 border-b">Reps</th>
                <th className="p-2 border-b">Lvl</th>
              </tr>
            </thead>
            <tbody>
              {exercise.sets.map((set, setIndex) => (
                <tr
                  key={setIndex}
                  className={`${
                    set.lvl === "Failure"
                      ? "bg-red-500 text-white"
                      : "text-gray-100"
                  } ${set.lvl === "Warm-up" ? "bg-blue-500" : ""}`}
                >
                  <td className="p-2 border-b">{setIndex + 1}</td>
                  <td className="p-2 border-b">{set.weight}</td>
                  <td className="p-2 border-b">{set.reps}</td>
                  <td className="p-2 border-b">{set.lvl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

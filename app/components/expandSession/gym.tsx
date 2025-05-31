import { formatDate } from "@/lib/formatDate";
import { groupGymExercises } from "@/lib/groupGymexercises";
import { russoOne } from "@/app/ui/fonts";
import { GymSessionFull } from "@/types/session";

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

export default function GymSession(gym_session: GymSessionFull) {
  const groupedExercises = groupGymExercises(
    gym_session.gym_session_exercises || []
  );

  return (
    <div className={`${russoOne.className}`}>
      <div
        className={`${russoOne.className} my-5 flex flex-col gap-2 justify-center items-center`}
      >
        <div className="text-sm text-gray-400">
          {formatDate(gym_session.created_at)}
        </div>
        <h2 className="text-xl  mt-2">{gym_session.title}</h2>
        <h3 className="mt-2">
          Duration: {formatDuration(gym_session.duration)}
        </h3>
        <p className="mt-4 text-gray-200 whitespace-pre-wrap break-words overflow-hidden max-w-full">
          {gym_session.notes}
        </p>
      </div>
      {Object.entries(groupedExercises).map(([superset_id, group]) => (
        <div
          key={superset_id}
          className="mt-6 bg-slate-900 rounded-md px-4 py-2 shadow-lg mx-4"
        >
          {group.length > 1 && (
            <h3 className="text-lg text-gray-100 mb-2 text-center">
              Super-Set
            </h3>
          )}

          {group.map(({ exercise, index }) => (
            <div key={index} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg text-gray-100 ">
                  {exercise.gym_exercises.name}
                </h3>
                <h2>{exercise.gym_exercises.equipment}</h2>
              </div>
              <div className="py-2 whitespace-pre-wrap break-words overflow-hidden max-w-full">
                {exercise.notes || ""}
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-100">
                    <th className="p-2 border-b font-normal">Set</th>
                    <th className="p-2 border-b font-normal">Weight</th>
                    <th className="p-2 border-b font-normal">Reps</th>
                    <th className="p-2 border-b font-normal">Lvl</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.gym_sets.map((set, setIndex) => (
                    <tr
                      key={setIndex}
                      className={`${
                        set.rpe === "Failure"
                          ? "bg-red-500 text-white"
                          : "text-gray-100"
                      } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                    >
                      <td className="p-2 border-b">{setIndex + 1}</td>
                      <td className="p-2 border-b">{set.weight}</td>
                      <td className="p-2 border-b">{set.reps}</td>
                      <td className="p-2 border-b">{set.rpe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

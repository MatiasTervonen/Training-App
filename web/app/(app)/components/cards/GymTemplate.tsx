import { formatDate } from "@/app/(app)/lib/formatDate";
import GroupTemplateExercises from "@/app/(app)/lib/groupTemplateExercises";
import {
  full_gym_template,
  full_gym_template_exercise,
} from "@/app/(app)/types/models";

type Props = {
  item: full_gym_template;
  onDelete: () => void;
  onExpand: () => void;
  onEdit: () => void;
  onStartWorkout: () => void;
};

export default function GymTemplate({ item, onDelete, onStartWorkout }: Props) {
  const groupedExercises = GroupTemplateExercises(
    item.gym_template_exercises || []
  );

  const isCardioExercise = (exercise: full_gym_template_exercise) =>
    exercise.gym_exercises.main_group.toLowerCase() === "cardio";

  return (
    <div className="mx-4">
      <div className="my-5 flex flex-col gap-2 justify-center items-center">
        <h2 className="text-sm text-gray-400">
          Created: {formatDate(item.created_at)}
        </h2>
        <h2 className="text-lg text-gray-100">{item.name}</h2>
      </div>
      {Object.entries(groupedExercises).map(([superset_id, group]) => (
        <div
          key={superset_id}
          className="mt-6 bg-slate-900 rounded-md px-4 py-2 shadow-lg max-w-md mx-auto"
        >
          {group.length > 1 && (
            <h3 className="text-lg text-gray-100 mb-2 text-center">
              Super-Set
            </h3>
          )}
          {group.map((exercise) => (
            <div key={exercise.id} className="mb-4">
              <div className="flex  justify-between flex-col mb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg text-gray-100 ">
                    {exercise.gym_exercises.name}
                  </h3>
                  <h3 className="text-sm text-gray-300">
                    {exercise.gym_exercises.muscle_group}
                  </h3>
                </div>
                <h2 className="text-sm text-gray-400">
                  {exercise.gym_exercises.equipment}
                </h2>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-100 border-b">
                    <th className="p-2 font-normal">Set</th>
                    {isCardioExercise(exercise) ? (
                      <>
                        <th className="p-2 font-normal">Time (min)</th>
                        <th className="p-2 font-normal">Rpe</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2 font-normal">Weight</th>
                        <th className="p-2 font-normal">Reps</th>
                        <th className="p-2 font-normal">Rpe</th>
                      </>
                    )}
                  </tr>
                </thead>
              </table>
            </div>
          ))}
        </div>
      ))}
      <button
        onClick={onStartWorkout}
        className="mb-5 max-w-md mx-auto mt-10  flex items-center justify-center w-full gap-2 bg-blue-800 py-2 rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95"
      >
        Start Workout
      </button>
      <button
        onClick={onDelete}
        className="mb-5 max-w-md mx-auto mt-5 flex items-center justify-center w-full gap-2 bg-red-800 py-2 rounded-md shadow-xl border-2 border-red-500 text-gray-100 text-lg cursor-pointer hover:bg-red-700 hover:scale-95"
      >
        Delete Workout
      </button>
    </div>
  );
}

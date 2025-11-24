import { formatDate } from "@/app/(app)/lib/formatDate";
import { GroupTemplateExercises } from "@/app/(app)/utils/GroupTemplateExercises";
import { full_gym_template } from "@/app/(app)/types/models";

type Props = {
  item: full_gym_template;
  onStartWorkout: () => void;
};

export default function GymTemplate({ item, onStartWorkout }: Props) {
  const groupedExercises = GroupTemplateExercises(
    item.gym_template_exercises || []
  );

  return (
    <div className="page-padding max-w-lg mx-auto">
      <div className="flex flex-col gap-2 justify-center items-center">
        <h2 className="text-sm text-gray-400">
          Created: {formatDate(item.created_at)}
        </h2>
        <h2 className="text-lg">{item.name}</h2>
      </div>
      {Object.entries(groupedExercises).map(([superset_id, group]) => (
        <div
          key={superset_id}
          className="mt-6 bg-slate-900 rounded-md px-4 py-2 shadow-md"
        >
          {group.length > 1 && (
            <h3 className="text-lg mb-2 text-center">Super-Set</h3>
          )}
          {group.map((exercise) => (
            <div key={exercise.id}>
              <div className="flex  justify-between flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg truncate mr-2">{exercise.gym_exercises.name}</h3>
                  <h3 className="text-sm text-gray-300">
                    {exercise.gym_exercises.muscle_group}
                  </h3>
                </div>
                <h2 className="text-sm text-gray-400 mt-2">
                  {exercise.gym_exercises.equipment}
                </h2>
              </div>
            </div>
          ))}
        </div>
      ))}
      <button
        onClick={onStartWorkout}
        className="w-full mt-10 bg-blue-800 py-2 rounded-md shadow-md border-2 border-blue-500 text-lg cursor-pointer hover:bg-blue-700 hover:scale-105 transition-transform duration-200"
      >
        Start Workout
      </button>
    </div>
  );
}

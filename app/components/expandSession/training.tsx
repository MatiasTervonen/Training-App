import { Session } from "@/types/session";

export default function TrainingSession({ session }: { session: Session }) {
  return (
    <div>
      {session.exercises?.map(
        (
          exercise: {
            name: string;
            sets: { reps: string; weight: string }[];
          },
          index: number
        ) => (
          <div key={index} className="text-gray-100">
            <div className="border-b w-fit">{exercise.name}</div>
            {exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className="text-gray-100 mt-1">
                {set.weight} kg x {set.reps}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

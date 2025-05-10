import { Session } from "@/types/session";
import { formatDate } from "@/lib/formatDate";

export default function TrainingSession({ session }: { session: Session }) {
  return (
    <div>
      {formatDate(session.created_at)}
      <div className="my-5">{session.title}</div>
      <div className="mb-5">{session.notes}</div>
      {session.exercises?.map(
        (
          exercise: {
            name: string;
            sets: { reps: string; weight: string }[];
          },
          index: number
        ) => (
          <div key={index} className="text-gray-100">
            <div className="border-b w-fit mb-2">{exercise.name}</div>
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

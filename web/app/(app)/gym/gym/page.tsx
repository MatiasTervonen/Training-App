import GymForm from "@/features/gym/components/GymForm";
import { full_gym_session } from "@/types/models";

export default function TrainingSessionPage() {
  const emptySession: full_gym_session = {
    id: "",
    user_id: "",
    title: "",
    notes: "",
    duration: 0,
    created_at: new Date().toISOString(),
    updated_at: "",
    activity_id: "",
    end_time: "",
    start_time: "",
    geom: null,
    template_id: null,
    gym_session_exercises: [],
  };

  return <GymForm initialData={emptySession} />;
}

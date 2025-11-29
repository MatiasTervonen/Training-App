import GymForm from "@/components/gym/GymForm";
import { full_gym_session } from "@/types/models";

export default function GymScreen() {
  const emptySession: full_gym_session = {
    id: "",
    user_id: "",
    title: "",
    notes: "",
    duration: 0,
    created_at: new Date().toISOString(),
    updated_at: "",
    gym_session_exercises: [],
  };

  return <GymForm initialData={emptySession} />;
}

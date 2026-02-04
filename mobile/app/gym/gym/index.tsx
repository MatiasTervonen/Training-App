import GymForm from "@/features/gym/GymForm";

export default function GymScreen() {
  return (
    <GymForm
      initialData={{
        id: "",
        title: "",
        notes: null,
        duration: 0,
        gym_session_exercises: [],
      }}
    />
  );
}

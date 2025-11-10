import GymForm from "@/app/(app)/training/components/GymForm";
import { getFullGymSession } from "@/app/(app)/database/gym";
import { full_gym_session } from "@/app/(app)/types/models";

export default async function EditGymPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let session!: full_gym_session;
  let errorMessage = "";

  try {
    session = await getFullGymSession(id);
  } catch (error) {
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = "Failed to load gym session.";
    }
  }

  return <GymForm initialData={session} errorMessage={errorMessage} />;
}

import LinkButton from "../ui/LinkButton";

export default function TrainingPage() {
  return (
    <div className="h-full bg-slate-800 text-gray-100 p-5">
      <h1 className="text-2xl my-5 text-center">Gym Session</h1>
      <div className="flex flex-col gap-5 max-w-md mx-auto">
        <LinkButton href={"/training/gym"}>Start empty workout</LinkButton>
        <LinkButton href={"/training/create-template"}>
          Create template
        </LinkButton>
        <LinkButton href={"/training/templates"}>Templates</LinkButton>
        <LinkButton href={"/training/workout-analytics"}>
          Workout Analytics
        </LinkButton>
      </div>
    </div>
  );
}

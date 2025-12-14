import LinkButton from "../components/buttons/LinkButton";

export default function WeightPage() {
  return (
    <div className="pt-5 px-5 pb-10 max-w-md mx-auto">
      <h1 className="text-2xl mb-10 text-center">Weight Tracking</h1>
      <div className="flex flex-col gap-4">
        <LinkButton href={"/weight/tracking"}>Tracking</LinkButton>
        <LinkButton href={"/weight/analytics"}>Analytics</LinkButton>
      </div>
    </div>
  );
}

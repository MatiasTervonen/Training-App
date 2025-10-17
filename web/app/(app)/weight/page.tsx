import LinkButton from "../ui/LinkButton";

export default function WeightPage() {
  return (
    <div className="h-full bg-slate-800 text-gray-100 p-5">
      <h1 className="text-2xl my-5 text-center">Weight Tracking</h1>
      <div className="flex flex-col max-w-md mx-auto gap-4">
        <LinkButton href={"/weight/tracking"}>Weight Tracking</LinkButton>
        <LinkButton href={"/weight/analytics"}>Analytics</LinkButton>
      </div>
    </div>
  );
}

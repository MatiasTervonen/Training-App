import { russoOne } from "@/app/ui/fonts";
import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";

export default function WorkoutAnalyticsPage() {
  return (
    <ModalPageWrapper noTopPadding>
      <div
        className={`${russoOne.className} h-full bg-slate-800 text-gray-100 p-5`}
      >
        <h1 className="text-2xl my-5 text-center">Workout Analytics</h1>
        <div className="flex flex-col max-w-md mx-auto">
          <p className="text-gray-300 text-center">
            This page is under construction. Please check back later.
          </p>
        </div>
      </div>
    </ModalPageWrapper>
  );
}

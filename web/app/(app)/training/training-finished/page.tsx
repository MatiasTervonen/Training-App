import Image from "next/image";
import ModalPageWrapper from "@/app/(app)/components/modalPageWrapper";
import LinkButton from "../../ui/LinkButton";

export default function TrainingFinished() {
  return (
    <ModalPageWrapper noTopPadding>
      <div className="h-full flex w-full px-10 bg-slate-900">
        <div className="flex flex-col items-center justify-center gap-10 max-w-md mx-auto">
          <Image src="/Confetti.png" alt="Confetti" width={50} height={50} />
          <h1 className="text-gray-100 font-bold text-lg">Congratulations!</h1>

          <p className="text-gray-100 text-center font-bold text-lg">
            You have completed your training session!
          </p>
          <LinkButton href="/dashboard">Done</LinkButton>
        </div>
      </div>
    </ModalPageWrapper>
  );
}

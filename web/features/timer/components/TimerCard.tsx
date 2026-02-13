import { formatDate } from "@/lib/formatDate";
import { timers } from "@/types/models";
import DeleteSessionBtn from "@/components/buttons/deleteSessionBtn";
import BaseButton from "@/components/buttons/BaseButton";
import EditButton from "@/components/buttons/EditButton";
import { useTranslation } from "react-i18next";
import { TimerIcon } from "lucide-react";

type Props = {
  item: timers;
  onDelete: () => void;
  onEdit: () => void;
  onStarTimer: () => void;
};

export default function TimerCard({
  item,
  onDelete,
  onEdit,
  onStarTimer,
}: Props) {
  const { t } = useTranslation("timer");

  const formatSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}${t("timer.minAbbrShort")} ${remainingSeconds}${t("timer.secAbbrShort")}`;
  };
  return (
    <>
      <div className="max-w-lg mx-auto flex flex-col gap-10 h-full page-padding justify-between ">
        <div>
          <p className="text-sm text-gray-400 text-center">
            {t("timer.created")} {formatDate(item.created_at)}
          </p>
          {item.updated_at && (
            <p className="text-sm text-yellow-500 mt-2 text-center">
              {t("common:common.updated")} {formatDate(item.updated_at)}
            </p>
          )}
          <div className="items-center bg-slate-900 p-5 rounded-md shadow-md mt-5">
            <h2 className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
              {item.title}
            </h2>
            <div className="bg-blue-900 px-6 py-2 rounded-md mx-auto flex justify-center items-center gap-4 w-fit">
              <TimerIcon size={20} color="#f3f4f6" />
              <p className="text-center text-lg">
                {formatSeconds(item.time_seconds)}
              </p>
            </div>
            {item.notes && <p className="mt-5 mb-2">{item.notes}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-5 mb-10">
          <BaseButton onClick={onStarTimer} label={t("timer.startTimer")} />
          <EditButton onClick={onEdit} label={t("timer.editTimer")} />
          <DeleteSessionBtn
            onDelete={onDelete}
            label={t("timer.deleteTimer")}
            confirmMessage={t("timer.deleteTimerConfirm")}
          />
        </div>
      </div>
    </>
  );
}

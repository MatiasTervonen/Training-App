"use client";

import { formatDate } from "@/lib/formatDate";
import { GroupTemplateExercises } from "@/utils/GroupTemplateExercises";
import { useTranslation } from "react-i18next";
import { FullGymTemplate } from "@/database/gym/templates/full-gym-template";

type Props = {
  item: FullGymTemplate;
};

export default function GymTemplate({ item }: Props) {
  const { t } = useTranslation("gym");
  const groupedExercises = GroupTemplateExercises(
    item.gym_template_exercises || [],
  );

  return (
    <div className="page-padding max-w-lg mx-auto">
      <div className="flex flex-col gap-2 justify-center items-center">
        <p className="text-sm text-gray-400 font-body">
          {t("common:common.created")} {formatDate(item.created_at)}
        </p>
        {item.updated_at && (
          <p className="text-slate-400 text-sm font-body">
            {t("common:common.updated")} {formatDate(item.updated_at)}
          </p>
        )}
        <h2 className="text-lg">{item.name}</h2>
      </div>
      {Object.entries(groupedExercises).map(([superset_id, group]) => (
        <div
          key={superset_id}
          className="mt-6 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md px-4 py-2 shadow-md border-[1.5px] border-gray-600"
        >
          {group.length > 1 && (
            <h3 className="text-lg mb-2 text-center">
              {t("gym.gymForm.superSet")}
            </h3>
          )}
          {group.map((exercise) => (
            <div key={exercise.id}>
              <div className="flex  justify-between flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg truncate mr-2">
                    {exercise.gym_exercises.name}
                  </h3>
                  <h3 className="text-sm text-gray-300">
                    {t(
                      `gym.muscleGroups.${exercise.gym_exercises.muscle_group}`,
                    )}
                  </h3>
                </div>
                <p className="text-sm text-gray-400 mt-2 font-body">
                  {t(`gym.equipment.${exercise.gym_exercises.equipment}`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

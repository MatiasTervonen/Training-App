"use client";

import { useState, useCallback } from "react";
import { formatDate } from "@/lib/formatDate";
import { GroupTemplateExercises } from "@/utils/GroupTemplateExercises";
import { useTranslation } from "react-i18next";
import { FullGymTemplate } from "@/database/gym/templates/full-gym-template";
import { ModalSwipeBlocker } from "@/components/modal";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { useSortable, isSortable, isSortableOperation } from "@dnd-kit/react/sortable";
import { editTemplate } from "@/database/gym/templates/edit-template";
import { useQueryClient } from "@tanstack/react-query";

type TemplateExercise = FullGymTemplate["gym_template_exercises"][number];

type Props = {
  item: FullGymTemplate;
};

export default function GymTemplate({ item }: Props) {
  const { t } = useTranslation("gym");
  const queryClient = useQueryClient();
  const [exercises, setExercises] = useState(item.gym_template_exercises || []);
  const groupedExercises = GroupTemplateExercises(exercises);
  const groupEntries = Object.entries(groupedExercises);

  const handleDragEnd = useCallback(
    (event: { canceled: boolean; operation: Parameters<typeof isSortableOperation>[0] }) => {
      if (event.canceled) return;
      if (!isSortableOperation(event.operation)) return;

      const { source } = event.operation;
      if (!source) return;
      const fromIndex = source.initialIndex;
      const toIndex = source.index;
      if (fromIndex === toIndex) return;

      setExercises((prev) => {
        const currentEntries = Object.entries(GroupTemplateExercises(prev));
        const reordered = [...currentEntries];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        const newExercises = reordered.flatMap(([, group]) => group);

        // Save reordered positions
        editTemplate({
          id: item.id,
          name: item.name,
          exercises: newExercises.map((ex, i) => ({
            exercise_id: ex.exercise_id,
            position: i,
            superset_id: ex.superset_id ?? undefined,
          })),
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["fullTemplate", item.id] });
          queryClient.invalidateQueries({ queryKey: ["templates"] });
        });

        return newExercises;
      });
    },
    [item.id, item.name, queryClient],
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
      <ModalSwipeBlocker>
        <DragDropProvider onDragEnd={handleDragEnd}>
          {groupEntries.map(([superset_id, group], groupIndex) => (
            <SortableTemplateGroup
              key={superset_id}
              id={superset_id}
              index={groupIndex}
              group={group}
              t={t}
            />
          ))}
          <DragOverlay>
            {(source) => {
              if (!isSortable(source)) return null;
              const group = groupEntries[source.index];
              if (!group) return null;
              const [, items] = group;
              return (
                <div className="mt-6 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md px-4 py-2 shadow-md border-[1.5px] border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02] opacity-90">
                  {items.map((exercise) => (
                    <div key={exercise.id}>
                      <h3 className="text-lg truncate">{exercise.gym_exercises.name}</h3>
                    </div>
                  ))}
                </div>
              );
            }}
          </DragOverlay>
        </DragDropProvider>
      </ModalSwipeBlocker>
    </div>
  );
}

function SortableTemplateGroup({
  id,
  index,
  group,
  t,
}: {
  id: string;
  index: number;
  group: TemplateExercise[];
  t: (key: string) => string;
}) {
  const { ref, isDragSource } = useSortable({ id, index });

  return (
    <div
      ref={ref}
      className={`mt-6 bg-linear-to-tr from-gray-900 via-slate-900 to-blue-900 rounded-md px-4 py-2 shadow-md border-[1.5px] border-gray-600 cursor-grab active:cursor-grabbing transition-opacity duration-200 ${isDragSource ? "opacity-40" : ""}`}
    >
      {group.length > 1 && (
        <h3 className="text-lg mb-2 text-center">
          {t("gym.gymForm.superSet")}
        </h3>
      )}
      {group.map((exercise) => (
        <div key={exercise.id}>
          <div className="flex justify-between flex-col">
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
  );
}

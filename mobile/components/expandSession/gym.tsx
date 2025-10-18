import { formatDate } from "@/lib/formatDate";
import { useUserStore } from "@/lib/stores/useUserStore";
import { full_gym_session, full_gym_exercises } from "@/types/models";
import  GroupExercises  from "@/components/gym/lib/GroupExercises";
import { View, SectionList } from "react-native";
import AppText from "../AppText";
import { LinearGradient } from "expo-linear-gradient";

const formatDuration = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function GymSession(gym_session: full_gym_session) {
  
  const groupedExercises = GroupExercises(
    gym_session.gym_session_exercises || []
  );

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const isCardioExercise = (exercise: full_gym_exercises) =>
    exercise.gym_exercises.main_group.toLowerCase() === "cardio";

  const sections = Object.entries(groupedExercises).map(
    ([superset_id, group]) => ({
      title: group.length > 1 ? "Super-Set" : "",
      data: group,
    })
  );

  return (
    <View className="px-4">
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.exercise.id}-${index}`}
        contentContainerStyle={{ paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="items-center my-5">
            <AppText className="text-2xl  mb-2">{gym_session.title}</AppText>
            <AppText className="text-md text-gray-400 mb-4">
              {formatDate(gym_session.created_at)}
            </AppText>
            <AppText className="text-md text-gray-400">
              Duration: {formatDuration(gym_session.duration!)}
            </AppText>
          </View>
        }
        renderSectionHeader={({ section }) =>
          section.title ? (
            <AppText className="text-xl  bg-slate-800 p-2">
              {section.title}
            </AppText>
          ) : null
        }
        renderItem={({ item, index, section }) => (
          <LinearGradient
            colors={["#1e3a8a", "#0f172a", "#0f172a"]}
            start={{ x: 1, y: 0 }} // bottom-left
            end={{ x: 0, y: 1 }} // top-right
            className={`py-5 px-4 rounded-md mb-10 ${
              section.title === "Super-Set"
                ? "border-2 border-blue-700"
                : "border-2 border-gray-600"
            }`}
          >
            <View className="flex justify-between flex-col">
              <View className="flex items-center justify-between">
                <AppText className="text-lg text-gray-100 ">
                  {item.exercise.position + 1}. {item.exercise.gym_exercises.name}
                </AppText>
                <AppText className="text-sm text-gray-400">
                  {item.exercise.gym_exercises.muscle_group} /{" "}
                  {item.exercise.gym_exercises.equipment}
                </AppText>
              </View>
            </View>
            <AppText className="py-2 whitespace-pre-wrap break-words overflow-hidden max-w-full">
              {item.exercise.notes || ""}
            </AppText>
            <View className="w-full text-left">
              <View className="w-full  text-gray-100">
                <View className="text-gray-300 border-b border-gray-300 flex-row">
                  {isCardioExercise(item.exercise) ? (
                    <>
                      <AppText className="p-2">Time (min)</AppText>
                      <AppText className="p-2">Duration (km)</AppText>
                    </>
                  ) : (
                    <>
                      <View className="w-[17%] text-center">
                        <AppText className="p-2">Set</AppText>
                      </View>
                      <View className="w-[28%] text-center">
                        <AppText className="p-2">Weight</AppText>
                      </View>
                      <View className="w-[20%] text-center">
                        <AppText className="p-2">Reps</AppText>
                      </View>
                      <View className="w-[30%] text-center">
                        <AppText className="p-2">RPE</AppText>
                      </View>
                      <View className="w-[5%] text-center">
                        <AppText className="p-2"></AppText>
                      </View>
                    </>
                  )}
                </View>
              </View>
              <View>
                {item.exercise.gym_sets.map((set, setIndex) => (
                  <View
                    key={setIndex}
                    className={`border-b border-gray-300 flex-row  items-center  ${
                      set.rpe === "Failure" ? "bg-red-800" : ""
                    } ${set.rpe === "Warm-up" ? "bg-blue-500" : ""}`}
                  >
                    {isCardioExercise(item.exercise) ? (
                      <>
                        <AppText className="p-2">{setIndex + 1}</AppText>
                        <AppText className="p-2">{set.weight} min</AppText>
                        <AppText className="p-2">{set.rpe}</AppText>
                      </>
                    ) : (
                      <>
                        <View className="w-[17%] text-center">
                          <AppText className="p-2">{setIndex + 1}</AppText>
                        </View>
                        <View className="w-[28%] text-center">
                          <AppText className="p-2">
                            {set.weight} {weightUnit}
                          </AppText>
                        </View>
                        <View className="w-[20%] text-center">
                          <AppText className="p-2">{set.reps}</AppText>
                        </View>
                        <View className="w-[30%] text-center">
                          <AppText className="p-2">{set.rpe}</AppText>
                        </View>
                      </>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        )}
      />
    </View>
  );
}

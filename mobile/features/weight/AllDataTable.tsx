import { useMemo, useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { weight } from "@/types/session";
import { View, SectionList } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { useConfirmAction } from "@/lib/confirmAction";
import { deleteSession } from "@/database/feed/deleteSession";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";
import HeaderAllDataTable from "@/features/weight/headerAllDataTable";
import WeightRow from "@/features/weight/RowAllDataTable";
import WeightShareModal from "@/features/weight/components/WeightShareModal";
import { useTranslation } from "react-i18next";
import i18n from "@/app/i18n";
import { Scale } from "lucide-react-native";
import BodyTextNC from "@/components/BodyTextNC";

type AllDataProps = {
  data: weight[];
  isLoading: boolean;
  error: unknown;
};

export default function AllDataTable({ data, isLoading, error }: AllDataProps) {
  const { t } = useTranslation("weight");

  const [expanded, setExpanded] = useState<string | null>(null);
  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const confirmAction = useConfirmAction();

  const queryClient = useQueryClient();

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const groupedData = useMemo(() => {
    return data.reduce(
      (acc, entry) => {
        const date = new Date(entry.created_at);
        const monthYear = date.toLocaleString(i18n.language, {
          month: "long",
          year: "numeric",
        });

        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(entry);
        return acc;
      },
      {} as Record<string, weight[]>,
    );
  }, [data]);

  // Transform into SectionList format

  const sections = useMemo(() => {
    return Object.entries(groupedData).map(([month, entries]) => {
      const diff =
        entries.length > 1
          ? entries[0].weight - entries[entries.length - 1].weight
          : 0;
      const formatted =
        diff > 0
          ? `+ ${Math.round(diff * 10) / 10}`
          : `${Math.round(diff * 10) / 10}`;
      return {
        title: month,
        data: entries,
        difference: formatted,
      };
    });
  }, [groupedData]);

  const handleDelete = async (item_id: string, table: string) => {
    const confirmed = await confirmAction({
      title: t("weight.analyticsScreen.deleteConfirm"),
    });
    if (!confirmed) return;

    const queryKey = ["get-weight"];

    await queryClient.cancelQueries({ queryKey });

    const previousData = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<weight[]>(queryKey, (oldData) =>
      oldData ? oldData.filter((item) => item.id !== item_id) : [],
    );

    try {
      await deleteSession(item_id, table);

      queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });

      Toast.show({
        type: "success",
        text1: t("weight.analyticsScreen.deleted"),
        text2: t("weight.analyticsScreen.deletedMessage"),
      });
    } catch {
      queryClient.setQueryData(queryKey, previousData);
      Toast.show({
        type: "error",
        text1: t("weight.analyticsScreen.deleteError"),
        text2: t("weight.analyticsScreen.deleteErrorMessage"),
      });
    }
  };

  const renderHeader = useMemo(
    () => (
      <HeaderAllDataTable
        key={range} // Force re-render when range changes
        range={range}
        setRange={setRange}
        isLoading={isLoading}
        error={error}
        data={data}
        onSharePress={() => setIsShareModalOpen(true)}
      />
    ),
    [range, setRange, isLoading, error, data],
  );

  return (
    <>
      <SectionList
        sections={sections}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View className="items-center mt-[10%] px-8">
              <View className="items-center">
                <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
                  <Scale size={36} color="#94a3b8" />
                </View>
                <AppText className="text-xl text-center mb-3">
                  {t("weight.analyticsScreen.noWeightEntries")}
                </AppText>
                <BodyTextNC className="text-sm text-gray-400 text-center">
                  {t("weight.analyticsScreen.noWeightEntriesDesc")}
                </BodyTextNC>
              </View>
            </View>
          ) : null
        }
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View className="bg-gray-800 px-4 py-2 flex-row justify-between items-center">
            <AppText className="text-lg">
              {section.title}
            </AppText>
            <BodyText>
              {section.difference} {weightUnit}
            </BodyText>
          </View>
        )}
        renderItem={({ item }) => (
          <WeightRow
            item={item}
            weightUnit={weightUnit}
            onDelete={async (id: string) => await handleDelete(id, "weight")}
            onExpand={(id) => setExpanded((prev) => (prev === id ? null : id))}
            expanded={expanded === item.id}
          />
        )}
      />
      <WeightShareModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        range={range}
        data={data}
        weightUnit={weightUnit}
      />
    </>
  );
}

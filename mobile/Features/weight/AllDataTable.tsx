import { useMemo, useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { weight } from "@/types/session";
import { View, SectionList } from "react-native";
import AppText from "@/components/AppText";
import { useConfirmAction } from "@/lib/confirmAction";
import { deleteSession } from "@/database/feed/deleteSession";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";
import HeaderAllDataTable from "@/features/weight/headerAllDataTable";
import WeightRow from "@/features/weight/RowAllDataTable";
import { useTranslation } from "react-i18next";
import i18n from "@/app/i18n";

type AllDataProps = {
  data: weight[];
  isLoading: boolean;
  error: unknown;
};

export default function AllDataTable({ data, isLoading, error }: AllDataProps) {
  const { t } = useTranslation("weight");

  const [expanded, setExpanded] = useState<string | null>(null);
  const [range, setRange] = useState<"week" | "month" | "year">("month");

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

      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

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
      />
    ),
    [range, setRange, isLoading, error, data],
  );

  return (
    <SectionList
      sections={sections}
      ListHeaderComponent={renderHeader}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View className="bg-gray-800 px-4 py-2 flex-row justify-between items-center">
          <AppText className="text-lg">
            {section.title}
          </AppText>
          <AppText>
            {section.difference} {weightUnit}
          </AppText>
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
  );
}

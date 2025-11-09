import { useMemo, useState } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { weight } from "@/types/models";
import { handleError } from "../../utils/handleError";
import { View, SectionList } from "react-native";
import AppText from "../AppText";
import { confirmAction } from "@/lib/confirmAction";
import { DeleteSession } from "@/api/feed/deleteSession";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";
import HeaderAllDataTable from "./headerAllDataTable";
import WeightRow from "./RowAllDataTable";

type AllDataProps = {
  data: weight[];
  isLoading: boolean;
  error: unknown;
};

export default function AllDataTable({ data, isLoading, error }: AllDataProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [range, setRange] = useState<"week" | "month" | "year">("month");

  const queryClient = useQueryClient();

  const weightUnit =
    useUserStore((state) => state.preferences?.weight_unit) || "kg";

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [data]);

  const groupedData = useMemo(() => {
    return sortedData.reduce((acc, entry) => {
      const date = new Date(entry.created_at);
      const monthYear = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(entry);
      return acc;
    }, {} as Record<string, weight[]>);
  }, [sortedData]);

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
      title: "Are you sure you want to delete this session?",
    });
    if (!confirmed) return;

    const queryKey = ["weightData"];

    await queryClient.cancelQueries({ queryKey });

    const previousData = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<weight[]>(queryKey, (oldData) =>
      oldData ? oldData.filter((item) => item.id !== item_id) : []
    );

    try {
      const result = await DeleteSession(item_id, table);

      if (!result.success) {
        throw new Error();
      }

      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      queryClient.invalidateQueries({ queryKey });

      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Item has been deleted successfully.",
      });
    } catch (error) {
      queryClient.setQueryData(queryKey, previousData);
      handleError(error, {
        message: "Unexpected Error deleting item",
        route: "/api/feed/deleteSession",
        method: "DELETE",
      });
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete item.",
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
    [range, setRange, isLoading, error, data]
  );

  return (
    <SectionList
      sections={sections}
      ListHeaderComponent={renderHeader}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View className="bg-gray-800 px-4 py-2 flex-row justify-between items-center">
          <AppText className="text-lg font-bold text-white">
            {section.title}
          </AppText>
          <AppText className="text-white">
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

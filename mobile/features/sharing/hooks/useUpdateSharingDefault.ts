import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertSharingDefault } from "@/database/sharing/upsert-sharing-default";
import { SharingDefault } from "@/database/sharing/get-sharing-defaults";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

export default function useUpdateSharingDefault() {
  const queryClient = useQueryClient();
  const { t } = useTranslation("sharing");

  return useMutation({
    mutationFn: ({
      sessionType,
      shareWithFriends,
    }: {
      sessionType: string;
      shareWithFriends: boolean;
    }) => upsertSharingDefault(sessionType, shareWithFriends),
    onMutate: async ({ sessionType, shareWithFriends }) => {
      await queryClient.cancelQueries({ queryKey: ["sharing-defaults"] });

      const previousData = queryClient.getQueryData<SharingDefault[]>(["sharing-defaults"]);

      queryClient.setQueryData<SharingDefault[]>(
        ["sharing-defaults"],
        (old) => {
          if (!old) return old;
          const existing = old.find((d) => d.session_type === sessionType);
          if (existing) {
            return old.map((d) =>
              d.session_type === sessionType
                ? { ...d, share_with_friends: shareWithFriends }
                : d,
            );
          }
          return [
            ...old,
            {
              id: "temp",
              user_id: "temp",
              session_type: sessionType,
              share_with_friends: shareWithFriends,
              created_at: new Date().toISOString(),
              updated_at: null,
            },
          ];
        },
      );

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["sharing-defaults"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sharing-defaults"] });
    },
    onSuccess: () => {
      Toast.show({ type: "success", text1: t("sharing.saved") });
    },
  });
}

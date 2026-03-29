import { useState, useCallback } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ClipboardList, Plus, FileEdit, Trash2 } from "lucide-react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import PageContainer from "@/components/PageContainer";
import AnimatedButton from "@/components/buttons/animatedButton";
import ErrorMessage from "@/components/ErrorMessage";
import PlanCard from "@/features/gym/plans/components/PlanCard";
import { getPlans, TrainingPlanSummary } from "@/database/gym/plans/get-plans";
import { deletePlan } from "@/database/gym/plans/delete-plan";
import { getDraftSummaries, clearPlanDraft, type DraftSummary } from "@/features/gym/plans/hooks/useSavePlanDraft";
import { useConfirmAction } from "@/lib/confirmAction";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";


export default function PlansListPage() {
  const { t } = useTranslation(["gym", "common"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmAction = useConfirmAction();
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [draftsChecked, setDraftsChecked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadDrafts = async () => {
        const summaries = await getDraftSummaries();
        setDrafts(summaries);
        setDraftsChecked(true);
      };
      loadDrafts();
    }, []),
  );

  const {
    data: plans = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["training-plans"],
    queryFn: getPlans,
  });

  const handleDeletePlan = async (planId: string) => {
    const confirmed = await confirmAction({
      title: t("gym:gym.plans.deletePlan"),
      message: t("gym:gym.plans.deletePlanConfirm"),
    });
    if (!confirmed) return;

    const previousPlans = queryClient.getQueryData<TrainingPlanSummary[]>(["training-plans"]);

    queryClient.setQueryData<TrainingPlanSummary[]>(["training-plans"], (old) => {
      if (!old) return old;
      return old.filter((p) => p.id !== planId);
    });

    try {
      await deletePlan(planId);
      await queryClient.invalidateQueries({ queryKey: ["active-training-plan"], exact: true });
      Toast.show({ type: "success", text1: t("gym:gym.plans.deleteSuccess") });
    } catch {
      queryClient.setQueryData(["training-plans"], previousPlans);
      Toast.show({ type: "error", text1: t("gym:gym.plans.deleteError") });
    }
  };

  const handleContinueDraft = (draftId: string) => {
    router.push({ pathname: "/gym/plans/create" as any, params: { draftId } });
  };

  const handleDeleteDraft = async (draftId: string) => {
    const confirmed = await confirmAction({
      title: t("gym:gym.plans.discardDraftTitle"),
      message: t("gym:gym.plans.discardDraftConfirm"),
    });
    if (!confirmed) return;

    await clearPlanDraft(draftId);
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleCreateNew = () => {
    router.push("/gym/plans/create" as any);
  };

  const hasDrafts = drafts.length > 0;

  return (
    <View className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageContainer>
          <AppText className="text-center mb-8 text-2xl">
            {t("gym:gym.plans.title")}
          </AppText>

          {isLoading && (
            <View className="items-center mt-10">
              <ActivityIndicator size="large" />
            </View>
          )}

          {error && <ErrorMessage message={t("gym:gym.plans.loadError")} />}

          {!isLoading && draftsChecked && plans.length === 0 && !error && !hasDrafts && (
            <View className="items-center mt-[20%] px-8">
              <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
                <ClipboardList size={36} color="#94a3b8" />
              </View>
              <AppText className="text-xl text-center mb-3">
                {t("gym:gym.plans.noPlans")}
              </AppText>
              <BodyText className="text-sm text-center">
                {t("gym:gym.plans.noPlansDesc")}
              </BodyText>
            </View>
          )}

          {/* Drafts */}
          {hasDrafts && (
            <View className="mb-5">
              <AppText className="text-lg mb-3">{t("gym:gym.plans.drafts")}</AppText>
              <View className="gap-3">
                {drafts.map((draft) => (
                  <LinearGradient
                    key={draft.id}
                    colors={["rgba(234,179,8,0.15)", "rgba(234,179,8,0.05)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="border border-yellow-700 rounded-lg overflow-hidden"
                  >
                    <AnimatedButton onPress={() => handleContinueDraft(draft.id)}>
                      <View className="px-4 py-3 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2 flex-1 mr-3">
                          <FileEdit size={18} color="#eab308" />
                          <View className="flex-1">
                            <AppText className="text-sm" numberOfLines={1}>
                              {draft.name || t("gym:gym.plans.draftFound")}
                            </AppText>
                            <BodyTextNC className="text-yellow-200/50 text-xs" numberOfLines={1}>
                              {t("gym:gym.plans.draftFoundDesc")}
                            </BodyTextNC>
                          </View>
                        </View>
                        <AnimatedButton
                          onPress={() => handleDeleteDraft(draft.id)}
                          hitSlop={10}
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </AnimatedButton>
                      </View>
                    </AnimatedButton>
                  </LinearGradient>
                ))}
              </View>
            </View>
          )}

          {/* Plans */}
          {plans.length > 0 && (
            <View>
              <AppText className="text-lg mb-3">{t("gym:gym.plans.plansSection")}</AppText>
              <View className="gap-4">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    item={plan}
                    onDelete={() => handleDeletePlan(plan.id)}
                    onEdit={() => router.push(`/gym/plans/${plan.id}/edit` as any)}
                    onPress={() => router.push(`/gym/plans/${plan.id}` as any)}
                  />
                ))}
              </View>
            </View>
          )}
        </PageContainer>
      </ScrollView>

      <View className="px-5 py-3 border-t border-slate-700">
        <AnimatedButton onPress={handleCreateNew} className="btn-add">
          <View className="flex-row items-center justify-center gap-2 px-2">
            <Plus size={20} color="#f3f4f6" />
            <AppText className="text-base text-center" numberOfLines={1}>
              {t("gym:gym.plans.create")}
            </AppText>
          </View>
        </AnimatedButton>
      </View>
    </View>
  );
}

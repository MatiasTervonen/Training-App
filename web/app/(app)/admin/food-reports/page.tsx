"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { SquareArrowOutUpRight, Trash2, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import useFoodReports from "@/features/admin/hooks/useFoodReports";
import { resolveFoodReport } from "@/database/admin/resolve-food-report";
import type { FoodReportItem } from "@/database/admin/get-food-reports";
import { formatDateShort } from "@/lib/formatDate";
import Spinner from "@/components/spinner";
import Modal from "@/components/modal";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

const NUTRIENT_KEYS = [
  { key: "calories", current: "current_calories_per_100g", reported: "reported_calories_per_100g" },
  { key: "protein", current: "current_protein_per_100g", reported: "reported_protein_per_100g" },
  { key: "carbs", current: "current_carbs_per_100g", reported: "reported_carbs_per_100g" },
  { key: "fat", current: "current_fat_per_100g", reported: "reported_fat_per_100g" },
  { key: "saturatedFat", current: "current_saturated_fat_per_100g", reported: "reported_saturated_fat_per_100g" },
  { key: "sugar", current: "current_sugar_per_100g", reported: "reported_sugar_per_100g" },
  { key: "fiber", current: "current_fiber_per_100g", reported: "reported_fiber_per_100g" },
  { key: "sodium", current: "current_sodium_per_100g", reported: "reported_sodium_per_100g" },
] as const;

function NutrientCompare({
  label,
  current,
  reported,
}: {
  label: string;
  current: number | null;
  reported: number | null;
}) {
  if (current == null && reported == null) return null;
  const changed = current !== reported;
  return (
    <div className="flex justify-between text-sm font-body py-0.5">
      <span className="text-slate-400">{label}</span>
      <div className="flex gap-3">
        <span className="text-slate-500 w-16 text-right">{current ?? "—"}</span>
        <span className="text-slate-600">→</span>
        <span className={`w-16 text-right ${changed ? "text-amber-400" : "text-slate-400"}`}>
          {reported ?? "—"}
        </span>
      </div>
    </div>
  );
}

function ReportCard({
  item,
  onExpand,
}: {
  item: FoodReportItem;
  onExpand: () => void;
}) {
  const { t } = useTranslation("common");

  return (
    <div className="shadow-sm shadow-black/50 rounded-md">
      <div className="border rounded-md flex flex-col transition-colors overflow-hidden card-default border-slate-700">
        {/* Header */}
        <div className="flex justify-between items-center px-4 pt-3 pb-1">
          <div className="flex-1 mr-4">
            <div className="text-lg text-gray-100 line-clamp-1">{item.food_name}</div>
            {item.brand && (
              <p className="text-sm text-slate-400 font-body">{item.brand}</p>
            )}
            {item.barcode && (
              <p className="text-xs text-slate-500 font-body">{item.barcode}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {item.image_url && (
              <Image
                src={item.image_url}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded object-cover"
                unoptimized
              />
            )}
            <span
              className={`text-xs font-body font-semibold px-2.5 py-1 rounded-full ${statusColors[item.status] ?? statusColors.pending}`}
            >
              {t(`admin.foodReports.${item.status}`)}
            </span>
          </div>
        </div>

        {/* Nutrient comparison (main 4) */}
        <div className="px-4 py-2">
          {NUTRIENT_KEYS.slice(0, 4).map(({ key, current, reported }) => (
            <NutrientCompare
              key={key}
              label={t(`admin.foodReports.${key}`)}
              current={item[current as keyof FoodReportItem] as number | null}
              reported={item[reported as keyof FoodReportItem] as number | null}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-slate-900/40 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm font-body">
              {item.display_name || item.user_email || "—"}
            </span>
            <span className="text-slate-500 text-sm">·</span>
            <span className="text-slate-400 text-sm font-body">
              {formatDateShort(item.created_at)}
            </span>
          </div>
          <button
            aria-label={t("admin.foodReports.details")}
            onClick={onExpand}
            className="flex items-center gap-2 cursor-pointer"
          >
            <SquareArrowOutUpRight size={18} className="text-slate-500" />
            <span className="text-slate-500 text-sm font-body">
              {t("admin.foodReports.details")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportExpanded({
  item,
  onResolved,
}: {
  item: FoodReportItem;
  onResolved: () => void;
}) {
  const { t } = useTranslation("common");
  const [resolving, setResolving] = useState<string | false>(false);

  // Editable fields pre-filled with reported values
  const [fields, setFields] = useState(() =>
    Object.fromEntries(
      NUTRIENT_KEYS.map(({ key, reported }) => [
        key,
        String(item[reported as keyof FoodReportItem] ?? ""),
      ]),
    ),
  );

  // Image state: tracks what the final image_url / nutrition_label_url should be on accept
  // null = delete, string = use this URL, undefined = keep current
  const [finalImageUrl, setFinalImageUrl] = useState<string | null | undefined>(undefined);
  const [finalNutritionLabelUrl, setFinalNutritionLabelUrl] = useState<string | null | undefined>(undefined);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const currentImageUrl = finalImageUrl === undefined ? item.image_url : finalImageUrl;
  const currentNutritionLabelUrl = finalNutritionLabelUrl === undefined ? item.nutrition_label_url : finalNutritionLabelUrl;

  // Collect all available images for the picker
  const allImages = [
    item.image_url ? { url: item.image_url, label: t("admin.foodReports.currentProduct") } : null,
    item.nutrition_label_url ? { url: item.nutrition_label_url, label: t("admin.foodReports.currentLabel") } : null,
    item.report_image_url ? { url: item.report_image_url, label: t("admin.foodReports.reportedProduct") } : null,
    item.report_nutrition_label_url ? { url: item.report_nutrition_label_url, label: t("admin.foodReports.reportedLabel") } : null,
  ].filter((img): img is { url: string; label: string } => img !== null);

  const updateField = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleResolve = async (action: "accepted" | "rejected" | "pending") => {
    setResolving(action);
    try {
      await resolveFoodReport({
        reportId: item.id,
        action,
        ...(action === "accepted"
          ? {
              caloriesPer100g: parseFloat(fields.calories) || null,
              proteinPer100g: parseFloat(fields.protein) || null,
              carbsPer100g: parseFloat(fields.carbs) || null,
              fatPer100g: parseFloat(fields.fat) || null,
              saturatedFatPer100g: fields.saturatedFat ? parseFloat(fields.saturatedFat) || null : null,
              sugarPer100g: fields.sugar ? parseFloat(fields.sugar) || null : null,
              fiberPer100g: fields.fiber ? parseFloat(fields.fiber) || null : null,
              sodiumPer100g: fields.sodium ? parseFloat(fields.sodium) || null : null,
              ...(finalImageUrl !== undefined ? { imageUrl: finalImageUrl } : {}),
              ...(finalNutritionLabelUrl !== undefined ? { nutritionLabelUrl: finalNutritionLabelUrl } : {}),
            }
          : {}),
      });
      onResolved();
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto page-padding pb-10">
      {/* Food info */}
      <div className="text-center mb-6">
        <h2 className="text-xl">{item.food_name}</h2>
        {item.brand && <p className="text-slate-400 font-body">{item.brand}</p>}
        {item.barcode && <p className="text-xs text-slate-500 font-body mt-1">{item.barcode}</p>}
        <p className="text-sm text-slate-500 font-body mt-1">
          {item.display_name || item.user_email || "—"}
        </p>
      </div>

      {/* All available images — click to expand */}
      {allImages.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-slate-400 font-body text-center mb-2">
            {t("admin.foodReports.allImages")}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {allImages.map((img) => (
              <div key={img.url} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setFullscreenImage(img.url)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={img.url}
                    alt={img.label}
                    width={100}
                    height={100}
                    className="rounded-lg object-cover w-[100px] h-[100px]"
                    unoptimized
                  />
                </button>
                <span className="text-[10px] text-slate-500 font-body">{img.label}</span>
                {item.status === "pending" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFinalImageUrl(img.url)}
                      className={`text-[10px] font-body px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        currentImageUrl === img.url
                          ? "bg-blue-500/30 text-blue-300"
                          : "bg-white/5 text-slate-500 hover:text-slate-300"
                      }`}
                      title={t("admin.foodReports.setAsProduct")}
                    >
                      {currentImageUrl === img.url && <Check size={10} className="inline mr-0.5" />}
                      {t("admin.foodReports.productImage")}
                    </button>
                    <button
                      onClick={() => setFinalNutritionLabelUrl(img.url)}
                      className={`text-[10px] font-body px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        currentNutritionLabelUrl === img.url
                          ? "bg-blue-500/30 text-blue-300"
                          : "bg-white/5 text-slate-500 hover:text-slate-300"
                      }`}
                      title={t("admin.foodReports.setAsLabel")}
                    >
                      {currentNutritionLabelUrl === img.url && <Check size={10} className="inline mr-0.5" />}
                      {t("admin.foodReports.nutritionLabel")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final image slots — what will be saved */}
      {item.status === "pending" && (
        <div className="mb-4">
          <p className="text-sm text-slate-400 font-body text-center mb-2">
            {t("admin.foodReports.finalImages")}
          </p>
          <div className="flex gap-6 justify-center">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-slate-500 font-body">{t("admin.foodReports.productImage")}</p>
              {currentImageUrl ? (
                <div className="relative">
                  <Image
                    src={currentImageUrl}
                    alt="Product"
                    width={80}
                    height={80}
                    className="rounded-lg object-cover w-[80px] h-[80px]"
                    unoptimized
                  />
                  <button
                    onClick={() => setFinalImageUrl(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center cursor-pointer hover:bg-red-900/50"
                  >
                    <Trash2 size={10} className="text-red-400" />
                  </button>
                </div>
              ) : (
                <div className="w-[80px] h-[80px] rounded-lg border border-dashed border-slate-600 flex items-center justify-center">
                  <span className="text-[10px] text-slate-600 font-body">{t("admin.foodReports.deleted")}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-slate-500 font-body">{t("admin.foodReports.nutritionLabel")}</p>
              {currentNutritionLabelUrl ? (
                <div className="relative">
                  <Image
                    src={currentNutritionLabelUrl}
                    alt="Nutrition label"
                    width={80}
                    height={80}
                    className="rounded-lg object-cover w-[80px] h-[80px]"
                    unoptimized
                  />
                  <button
                    onClick={() => setFinalNutritionLabelUrl(null)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center cursor-pointer hover:bg-red-900/50"
                  >
                    <Trash2 size={10} className="text-red-400" />
                  </button>
                </div>
              ) : (
                <div className="w-[80px] h-[80px] rounded-lg border border-dashed border-slate-600 flex items-center justify-center">
                  <span className="text-[10px] text-slate-600 font-body">{t("admin.foodReports.deleted")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      {item.explanation && (
        <div className="mb-4 bg-white/5 rounded-md p-3">
          <p className="text-sm text-slate-400 font-body mb-1">
            {t("admin.foodReports.explanation")}
          </p>
          <p className="text-sm text-slate-200 font-body">{item.explanation}</p>
        </div>
      )}

      {/* Side-by-side: current vs editable reported */}
      <div className="bg-white/5 rounded-md p-4">
        <div className="grid grid-cols-3 gap-2 mb-3 text-sm font-body">
          <div />
          <div className="text-center text-slate-400">{t("admin.foodReports.currentValues")}</div>
          <div className="text-center text-slate-400">{t("admin.foodReports.reportedValues")}</div>
        </div>

        {NUTRIENT_KEYS.map(({ key, current }) => {
          const currentVal = item[current as keyof FoodReportItem] as number | null;
          return (
            <div key={key} className="grid grid-cols-3 gap-2 items-center py-1.5">
              <span className="text-sm font-body text-slate-400">
                {t(`admin.foodReports.${key}`)}
              </span>
              <span className="text-center text-sm font-body text-slate-300">
                {currentVal ?? "—"}
              </span>
              <input
                type="number"
                step="any"
                value={fields[key]}
                onChange={(e) => updateField(key, e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-center text-slate-200 font-body w-full"
                disabled={item.status !== "pending"}
              />
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {item.status === "pending" && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleResolve("rejected")}
            disabled={!!resolving}
            className="flex-1 btn-danger flex items-center justify-center"
          >
            {resolving === "rejected" ? <Spinner size="w-4 h-4" /> : t("admin.foodReports.reject")}
          </button>
          <button
            onClick={() => handleResolve("accepted")}
            disabled={!!resolving}
            className="flex-1 btn-base flex items-center justify-center"
          >
            {resolving === "accepted" ? <Spinner size="w-4 h-4" /> : t("admin.foodReports.accept")}
          </button>
        </div>
      )}

      {item.status === "rejected" && (
        <div className="flex flex-col items-center gap-2 mt-6">
          <p className="text-slate-500 font-body">
            {t("admin.foodReports.rejected")}
          </p>
          <button
            onClick={() => handleResolve("pending")}
            disabled={!!resolving}
            className="text-sm font-body text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            {t("admin.foodReports.revertToPending")}
          </button>
        </div>
      )}

      {item.status === "accepted" && (
        <p className="text-center text-slate-500 font-body mt-6">
          {t("admin.foodReports.accepted")}
        </p>
      )}

      {/* Fullscreen image viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <Image
            src={fullscreenImage}
            alt=""
            width={800}
            height={800}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}

export default function AdminFoodReportsPage() {
  const { t } = useTranslation("common");
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [expandedItem, setExpandedItem] = useState<FoodReportItem | null>(null);

  const {
    items,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFoodReports(filter);

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleResolved = () => {
    setExpandedItem(null);
    queryClient.invalidateQueries({ queryKey: ["admin-food-reports"] });
  };

  const filters = [
    { key: undefined, label: "all" },
    { key: "pending", label: "pending" },
    { key: "accepted", label: "accepted" },
    { key: "rejected", label: "rejected" },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto page-padding">
      <h1 className="text-2xl mb-6 text-center">
        {t("admin.foodReports.title")}
      </h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.key)}
            className={`text-sm font-body px-3 py-1.5 rounded-full transition-colors ${
              filter === f.key
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {t(`admin.foodReports.filters.${f.label}`)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner size="w-8 h-8" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <p className="text-center text-gray-400 font-body py-10">
          {t("admin.foodReports.empty")}
        </p>
      )}

      {/* Feed */}
      {items.map((item) => (
        <div className="mt-8" key={item.id}>
          <ReportCard item={item} onExpand={() => setExpandedItem(item)} />
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner size="w-5 h-5" />
        </div>
      )}

      {/* Expanded modal */}
      <Modal isOpen={!!expandedItem} onClose={() => setExpandedItem(null)}>
        {expandedItem && (
          <ReportExpanded item={expandedItem} onResolved={handleResolved} />
        )}
      </Modal>
    </div>
  );
}

import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import AnimatedButton from "@/components/buttons/animatedButton";
import { getFoodNutrients } from "@/database/nutrition/get-food-nutrients";
import type { FoodNutrient } from "@/database/nutrition/get-food-nutrients";
import { useTranslation } from "react-i18next";

const NUTRIENT_GROUPS = [
  {
    key: "vitamins",
    codes: [
      "VITA",
      "CAROTENS",
      "VITD",
      "VITE",
      "VITK",
      "VITC",
      "THIA",
      "RIBF",
      "NIA",
      "VITPYRID",
      "FOL",
      "VITB12",
    ],
  },
  {
    key: "minerals",
    codes: ["CA", "FE", "ID", "K", "MG", "P", "SE", "ZN"],
  },
  {
    key: "fattyAcids",
    codes: [
      "FAMCIS",
      "FAPU",
      "FATRN",
      "FAPUN3",
      "FAPUN6",
      "F18D2CN6",
      "F18D3N3",
      "F20D5N3",
      "F22D6N3",
      "CHOLE",
    ],
  },
  {
    key: "carbDetails",
    codes: ["STARCH", "FRUS", "GLUS", "LACS", "MALS", "SUCS", "GALS", "SUGOH", "OA", "ALC"],
  },
] as const;

const NUTRIENT_LABELS: Record<string, { en: string; fi: string }> = {
  // Vitamins
  VITA: { en: "Vitamin A", fi: "A-vitamiini" },
  CAROTENS: { en: "Beta-carotene", fi: "Beetakaroteeni" },
  VITD: { en: "Vitamin D", fi: "D-vitamiini" },
  VITE: { en: "Vitamin E", fi: "E-vitamiini" },
  VITK: { en: "Vitamin K", fi: "K-vitamiini" },
  VITC: { en: "Vitamin C", fi: "C-vitamiini" },
  THIA: { en: "Thiamine (B1)", fi: "Tiamiini (B1)" },
  RIBF: { en: "Riboflavin (B2)", fi: "Riboflaviini (B2)" },
  NIA: { en: "Niacin (B3)", fi: "Niasiini (B3)" },
  VITPYRID: { en: "Pyridoxine (B6)", fi: "Pyridoksiini (B6)" },
  FOL: { en: "Folate", fi: "Folaatti" },
  VITB12: { en: "Vitamin B12", fi: "B12-vitamiini" },
  // Minerals
  CA: { en: "Calcium", fi: "Kalsium" },
  FE: { en: "Iron", fi: "Rauta" },
  ID: { en: "Iodine", fi: "Jodi" },
  K: { en: "Potassium", fi: "Kalium" },
  MG: { en: "Magnesium", fi: "Magnesium" },
  P: { en: "Phosphorus", fi: "Fosfori" },
  SE: { en: "Selenium", fi: "Seleeni" },
  ZN: { en: "Zinc", fi: "Sinkki" },
  // Fatty acids
  FAMCIS: { en: "Monounsaturated fat", fi: "Kertatyydyttymätön rasva" },
  FAPU: { en: "Polyunsaturated fat", fi: "Monityydyttymätön rasva" },
  FATRN: { en: "Trans fat", fi: "Transrasva" },
  FAPUN3: { en: "Omega-3", fi: "Omega-3" },
  FAPUN6: { en: "Omega-6", fi: "Omega-6" },
  F18D2CN6: { en: "Linoleic acid", fi: "Linolihappo" },
  F18D3N3: { en: "Alpha-linolenic acid", fi: "Alfalinoleenihappo" },
  F20D5N3: { en: "EPA", fi: "EPA" },
  F22D6N3: { en: "DHA", fi: "DHA" },
  CHOLE: { en: "Cholesterol", fi: "Kolesteroli" },
  // Carb details
  STARCH: { en: "Starch", fi: "Tärkkelys" },
  FRUS: { en: "Fructose", fi: "Fruktoosi" },
  GLUS: { en: "Glucose", fi: "Glukoosi" },
  LACS: { en: "Lactose", fi: "Laktoosi" },
  MALS: { en: "Maltose", fi: "Maltoosi" },
  SUCS: { en: "Sucrose", fi: "Sakkaroosi" },
  GALS: { en: "Galactose", fi: "Galaktoosi" },
  SUGOH: { en: "Sugar alcohols", fi: "Sokerialkoholit" },
  OA: { en: "Organic acids", fi: "Orgaaniset hapot" },
  ALC: { en: "Alcohol", fi: "Alkoholi" },
};

function formatValue(value: number, unit: string): string {
  if (unit === "UG") return `${Math.round(value * 10) / 10} µg`;
  if (unit === "MG") return `${Math.round(value * 10) / 10} mg`;
  return `${Math.round(value * 10) / 10} g`;
}

type DetailedNutrientsProps = {
  foodId: string;
  scale: number;
};

export default function DetailedNutrients({ foodId, scale }: DetailedNutrientsProps) {
  const { t, i18n } = useTranslation("nutrition");
  const [expanded, setExpanded] = useState(false);
  const lang = i18n.language === "fi" ? "fi" : "en";

  const { data: nutrients } = useQuery({
    queryKey: ["foodNutrients", foodId],
    queryFn: () => getFoodNutrients(foodId),
    enabled: expanded,
  });

  const nutrientMap = new Map(
    (nutrients ?? []).map((n) => [n.nutrient_code, n]),
  );

  const hasNutrients = nutrients && nutrients.length > 0;

  return (
    <View>
      <AnimatedButton
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between py-3"
      >
        <AppText className="text-sm">
          {t("detail.detailedNutrients")}
        </AppText>
        {expanded ? (
          <ChevronUp size={18} color="#94a3b8" />
        ) : (
          <ChevronDown size={18} color="#94a3b8" />
        )}
      </AnimatedButton>

      {expanded && (
        <View>
          {!hasNutrients && nutrients !== undefined && (
            <BodyText className="text-xs text-center py-2">
              {t("detail.noDetailedNutrients")}
            </BodyText>
          )}

          {hasNutrients &&
            NUTRIENT_GROUPS.map((group) => {
              const groupNutrients = group.codes
                .map((code) => nutrientMap.get(code))
                .filter((n): n is FoodNutrient => n !== undefined);

              if (groupNutrients.length === 0) return null;

              return (
                <View key={group.key} className="mb-3">
                  <AppText className="text-xs text-slate-400 mb-1">
                    {t(`detail.group_${group.key}`)}
                  </AppText>
                  {groupNutrients.map((n) => (
                    <View
                      key={n.nutrient_code}
                      className="flex-row justify-between py-1.5 border-b border-slate-800"
                    >
                      <BodyText className="text-sm">
                        {NUTRIENT_LABELS[n.nutrient_code]?.[lang] ??
                          n.nutrient_code}
                      </BodyText>
                      <BodyTextNC className="text-sm text-slate-400">
                        {formatValue(n.value * scale, n.unit)}
                      </BodyTextNC>
                    </View>
                  ))}
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
}

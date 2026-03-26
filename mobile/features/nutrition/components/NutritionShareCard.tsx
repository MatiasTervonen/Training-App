import { forwardRef, useMemo } from "react";
import { Image, View } from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import AppText from "@/components/AppText";
import { formatDateShort } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import { ShareCardTheme, ShareCardSize } from "@/lib/share/themes";
import ThemedCardWrapper from "@/lib/components/share/ThemedCardWrapper";

type MealSummary = {
  label: string;
  calories: number;
  entryCount: number;
};

type NutritionShareCardProps = {
  date: string;
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number | null;
  carbs: number;
  carbsGoal: number | null;
  fat: number;
  fatGoal: number | null;
  meals: MealSummary[];
  theme: ShareCardTheme;
  size: ShareCardSize;
};

/* ── Skia arc path helper ── */
function makeArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  sweepAngle: number,
) {
  const path = Skia.Path.Make();
  const oval = { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 };
  path.addArc(oval, startAngle, sweepAngle);
  return path;
}

/* ── Calorie ring (Skia Canvas — captured by makeImageFromView) ── */
function ShareCalorieRing({
  consumed,
  goal,
  ringSize,
  strokeWidth,
  fontSize,
  labelSize,
  theme,
}: {
  consumed: number;
  goal: number;
  ringSize: number;
  strokeWidth: number;
  fontSize: number;
  labelSize: number;
  theme: ShareCardTheme;
}) {
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const ringColor = consumed > goal ? "#ef4444" : "#ff00ff";
  const cx = ringSize / 2;
  const cy = ringSize / 2;
  const radius = (ringSize - strokeWidth) / 2;

  const trackPath = useMemo(
    () => makeArcPath(cx, cy, radius, 0, 360),
    [cx, cy, radius],
  );
  const progressPath = useMemo(
    () => makeArcPath(cx, cy, radius, -90, progress * 360),
    [cx, cy, radius, progress],
  );

  return (
    <View collapsable={false} style={{ width: ringSize, height: ringSize, alignItems: "center", justifyContent: "center" }}>
      <Canvas style={{ width: ringSize, height: ringSize, position: "absolute" }}>
        <Path
          path={trackPath}
          style="stroke"
          strokeWidth={strokeWidth}
          color={theme.colors.statBoxBorder}
          strokeCap="round"
        />
        {progress > 0 && (
          <Path
            path={progressPath}
            style="stroke"
            strokeWidth={strokeWidth}
            color={ringColor}
            strokeCap="round"
          />
        )}
      </Canvas>
      <View style={{ alignItems: "center" }}>
        <AppText style={{ fontSize, color: theme.colors.textPrimary }}>
          {Math.round(consumed)}
        </AppText>
        <AppText style={{ fontSize: labelSize, color: theme.colors.textMuted }}>
          kcal
        </AppText>
        <AppText style={{ fontSize: labelSize * 0.75, color: theme.colors.textMuted, marginTop: 4 }}>
          / {goal}
        </AppText>
      </View>
    </View>
  );
}

/* ── Macro ring ── */
function ShareMacroRing({
  value,
  progress,
  label,
  color,
  ringSize,
  strokeWidth,
  fontSize,
  labelSize,
  theme,
}: {
  value: number;
  progress: number;
  label: string;
  color: string;
  ringSize: number;
  strokeWidth: number;
  fontSize: number;
  labelSize: number;
  theme: ShareCardTheme;
}) {
  const cx = ringSize / 2;
  const cy = ringSize / 2;
  const radius = (ringSize - strokeWidth) / 2;

  const trackPath = useMemo(
    () => makeArcPath(cx, cy, radius, 0, 360),
    [cx, cy, radius],
  );
  const progressPath = useMemo(
    () => makeArcPath(cx, cy, radius, -90, progress * 360),
    [cx, cy, radius, progress],
  );

  return (
    <View collapsable={false} style={{ alignItems: "center", gap: 8 }}>
      <View collapsable={false} style={{ width: ringSize, height: ringSize, alignItems: "center", justifyContent: "center" }}>
        <Canvas style={{ width: ringSize, height: ringSize, position: "absolute" }}>
          <Path
            path={trackPath}
            style="stroke"
            strokeWidth={strokeWidth}
            color={theme.colors.statBoxBorder}
            strokeCap="round"
          />
          {progress > 0 && (
            <Path
              path={progressPath}
              style="stroke"
              strokeWidth={strokeWidth}
              color={color}
              strokeCap="round"
            />
          )}
        </Canvas>
        <AppText
          style={{ fontSize, color: theme.colors.textPrimary }}
        >
          {Math.round(value)}
        </AppText>
      </View>
      <AppText style={{ fontSize: labelSize, color: theme.colors.textMuted }}>
        {label}
      </AppText>
    </View>
  );
}

/* ── Main share card ── */
const NutritionShareCard = forwardRef<View, NutritionShareCardProps>(
  (
    {
      date,
      calories,
      calorieGoal,
      protein,
      proteinGoal,
      carbs,
      carbsGoal,
      fat,
      fatGoal,
      meals,
      theme,
      size,
    },
    ref,
  ) => {
    const { t } = useTranslation("nutrition");
    const { colors } = theme;

    const totalMacros = protein + carbs + fat;
    const proteinPct = totalMacros > 0 ? protein / totalMacros : 0;
    const carbsPct = totalMacros > 0 ? carbs / totalMacros : 0;
    const fatPct = totalMacros > 0 ? fat / totalMacros : 0;

    if (size === "wide") {
      return (
        <ThemedCardWrapper ref={ref} theme={theme} size={size}>
          {/* Logo fixed at top */}
          <View className="flex-row items-center gap-4" style={{ position: "absolute", top: 60, left: 60 }}>
            <Image
              source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
              style={{ width: 64, height: 64, borderRadius: 8 }}
            />
            <AppText style={{ fontSize: 36, color: colors.accent }}>
              {APP_NAME}
            </AppText>
          </View>

          {/* Title fixed at top center */}
          <View style={{ position: "absolute", top: 60, left: 0, right: 0, alignItems: "center", gap: 8 }}>
            <AppText
              style={{ fontSize: 56, color: colors.textPrimary, textAlign: "center" }}
            >
              {t("share.title")}
            </AppText>
            <AppText style={{ fontSize: 32, color: colors.textMuted }}>
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* All content centered */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View className="flex-row" style={{ gap: 80, alignItems: "center" }}>
              {/* Left: Calorie ring + Macro rings */}
              <View style={{ alignItems: "center", gap: 30 }}>
                <ShareCalorieRing
                  consumed={calories}
                  goal={calorieGoal}
                  ringSize={300}
                  strokeWidth={24}
                  fontSize={58}
                  labelSize={28}
                  theme={theme}
                />

                <View className="flex-row" style={{ gap: 40 }}>
                  <ShareMacroRing
                    value={protein}
                    progress={proteinPct}
                    label={`${t("share.protein")} (g)`}
                    color="#38bdf8"
                    ringSize={120}
                    strokeWidth={10}
                    fontSize={32}
                    labelSize={22}
                    theme={theme}
                  />
                  <ShareMacroRing
                    value={carbs}
                    progress={carbsPct}
                    label={`${t("share.carbs")} (g)`}
                    color="#f59e0b"
                    ringSize={120}
                    strokeWidth={10}
                    fontSize={32}
                    labelSize={22}
                    theme={theme}
                  />
                  <ShareMacroRing
                    value={fat}
                    progress={fatPct}
                    label={`${t("share.fat")} (g)`}
                    color="#f43f5e"
                    ringSize={120}
                    strokeWidth={10}
                    fontSize={32}
                    labelSize={22}
                    theme={theme}
                  />
                </View>
              </View>

              {/* Right: Meal breakdown */}
              {meals.length > 0 && (
                <View style={{ gap: 16 }}>
                  {meals.map((meal, i) => (
                    <View key={i} className="flex-row justify-between items-center" style={{ width: 400 }}>
                      <AppText
                        style={{ fontSize: 32, color: colors.textSecondary }}
                        numberOfLines={1}
                      >
                        {meal.label}
                      </AppText>
                      <AppText style={{ fontSize: 32, color: colors.textMuted }}>
                        {Math.round(meal.calories)} kcal
                      </AppText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* URL bottom center */}
          <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
            <AppText style={{ fontSize: 24, color: colors.textMuted, opacity: 0.5 }}>
              kurvi.io
            </AppText>
          </View>
        </ThemedCardWrapper>
      );
    }

    if (size === "story") {
      return (
        <ThemedCardWrapper ref={ref} theme={theme} size={size}>
          {/* Logo fixed at top */}
          <View className="flex-row items-center gap-4" style={{ position: "absolute", top: 60, left: 60 }}>
            <Image
              source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
              style={{ width: 80, height: 80, borderRadius: 8 }}
            />
            <AppText style={{ fontSize: 44, color: colors.accent }}>
              {APP_NAME}
            </AppText>
          </View>

          {/* All content centered */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 60 }}>
            {/* Title + Date */}
            <View style={{ alignItems: "center", gap: 16 }}>
              <AppText
                style={{ fontSize: 80, color: colors.textPrimary, textAlign: "center" }}
              >
                {t("share.title")}
              </AppText>
              <AppText style={{ fontSize: 46, color: colors.textMuted }}>
                {formatDateShort(date)}
              </AppText>
            </View>

            {/* Calorie ring */}
            <ShareCalorieRing
              consumed={calories}
              goal={calorieGoal}
              ringSize={420}
              strokeWidth={30}
              fontSize={76}
              labelSize={38}
              theme={theme}
            />

            {/* Macro rings */}
            <View className="flex-row" style={{ gap: 60 }}>
              <ShareMacroRing
                value={protein}
                progress={proteinPct}
                label={`${t("share.protein")} (g)`}
                color="#38bdf8"
                ringSize={170}
                strokeWidth={14}
                fontSize={42}
                labelSize={28}
                theme={theme}
              />
              <ShareMacroRing
                value={carbs}
                progress={carbsPct}
                label={`${t("share.carbs")} (g)`}
                color="#f59e0b"
                ringSize={170}
                strokeWidth={14}
                fontSize={42}
                labelSize={28}
                theme={theme}
              />
              <ShareMacroRing
                value={fat}
                progress={fatPct}
                label={`${t("share.fat")} (g)`}
                color="#f43f5e"
                ringSize={170}
                strokeWidth={14}
                fontSize={42}
                labelSize={28}
                theme={theme}
              />
            </View>

            {/* Meal breakdown */}
            {meals.length > 0 && (
              <View style={{ width: "65%", gap: 16 }}>
                {meals.map((meal, i) => (
                  <View key={i} className="flex-row justify-between items-center">
                    <AppText
                      style={{ fontSize: 42, color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      {meal.label}
                    </AppText>
                    <AppText style={{ fontSize: 42, color: colors.textMuted }}>
                      {Math.round(meal.calories)} kcal
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* URL bottom center */}
          <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
            <AppText style={{ fontSize: 28, color: colors.textMuted, opacity: 0.5 }}>
              kurvi.io
            </AppText>
          </View>
        </ThemedCardWrapper>
      );
    }

    // Square
    return (
      <ThemedCardWrapper ref={ref} theme={theme} size={size}>
        {/* Logo fixed at top */}
        <View className="flex-row items-center gap-4" style={{ position: "absolute", top: 60, left: 60 }}>
          <Image
            source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
            style={{ width: 64, height: 64, borderRadius: 8 }}
          />
          <AppText style={{ fontSize: 36, color: colors.accent }}>
            {APP_NAME}
          </AppText>
        </View>

        {/* All content centered */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 40 }}>
          {/* Title + Date */}
          <View style={{ alignItems: "center", gap: 12 }}>
            <AppText
              style={{ fontSize: 52, color: colors.textPrimary, textAlign: "center" }}
            >
              {t("share.title")}
            </AppText>
            <AppText style={{ fontSize: 32, color: colors.textMuted }}>
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* Calorie ring */}
          <ShareCalorieRing
            consumed={calories}
            goal={calorieGoal}
            ringSize={240}
            strokeWidth={20}
            fontSize={48}
            labelSize={24}
            theme={theme}
          />

          {/* Macro rings */}
          <View className="flex-row" style={{ gap: 40 }}>
            <ShareMacroRing
              value={protein}
              progress={proteinPct}
              label={`${t("share.protein")} (g)`}
              color="#38bdf8"
              ringSize={100}
              strokeWidth={9}
              fontSize={28}
              labelSize={18}
              theme={theme}
            />
            <ShareMacroRing
              value={carbs}
              progress={carbsPct}
              label={`${t("share.carbs")} (g)`}
              color="#f59e0b"
              ringSize={100}
              strokeWidth={9}
              fontSize={28}
              labelSize={18}
              theme={theme}
            />
            <ShareMacroRing
              value={fat}
              progress={fatPct}
              label={`${t("share.fat")} (g)`}
              color="#f43f5e"
              ringSize={100}
              strokeWidth={9}
              fontSize={28}
              labelSize={18}
              theme={theme}
            />
          </View>

          {/* Meal breakdown */}
          {meals.length > 0 && (
            <View style={{ width: "70%", gap: 10 }}>
              {meals.map((meal, i) => (
                <View key={i} className="flex-row justify-between items-center">
                  <AppText
                    style={{ fontSize: 28, color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {meal.label}
                  </AppText>
                  <AppText style={{ fontSize: 28, color: colors.textMuted }}>
                    {Math.round(meal.calories)} kcal
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* URL bottom center */}
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
          <AppText style={{ fontSize: 24, color: colors.textMuted, opacity: 0.5 }}>
            kurvi.io
          </AppText>
        </View>
      </ThemedCardWrapper>
    );
  },
);

NutritionShareCard.displayName = "NutritionShareCard";

export default NutritionShareCard;

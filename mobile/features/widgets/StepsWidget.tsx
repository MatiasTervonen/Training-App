import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetInfo } from "react-native-android-widget";
import type { StepsConfig } from "@/features/widgets/widget-constants";
import { DEFAULT_STEPS_CONFIG } from "@/features/widgets/widget-constants";

interface StepsWidgetProps {
  config?: StepsConfig;
  widgetInfo?: WidgetInfo;
  steps?: number;
  yesterdaySteps?: number;
}

function formatSteps(count: number): string {
  if (count >= 1000) {
    return count.toLocaleString("en-US");
  }
  return String(count);
}

function GoalBar({
  steps,
  dailyGoal,
}: {
  steps: number;
  dailyGoal: number;
}) {
  const percentage = Math.min(Math.round((steps / dailyGoal) * 100), 100);
  // Use flex ratios for the filled vs unfilled portions of the bar
  const fillFlex = Math.max(percentage, 1);
  const emptyFlex = Math.max(100 - percentage, 0);
  const fillColor = percentage >= 100 ? "#22c55e" : "#3b82f6";

  return (
    <FlexWidget
      style={{
        flexDirection: "column",
        width: "match_parent",
        marginTop: 8,
      }}
    >
      {/* Goal label row */}
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <TextWidget
          text={`Goal: ${dailyGoal.toLocaleString("en-US")}`}
          style={{
            fontSize: 11,
            color: "#94a3b8",
          }}
        />
        <TextWidget
          text={`${percentage}%`}
          style={{
            fontSize: 11,
            color: percentage >= 100 ? "#22c55e" : "#94a3b8",
            fontWeight: "bold",
          }}
        />
      </FlexWidget>

      {/* Progress bar using flex ratios */}
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          height: 6,
          backgroundColor: "#334155",
          borderRadius: 3,
        }}
      >
        {/* Filled portion */}
        {fillFlex > 0 && (
          <FlexWidget
            style={{
              flex: fillFlex,
              height: 6,
              backgroundColor: fillColor,
              borderRadius: 3,
            }}
          />
        )}
        {/* Empty portion */}
        {emptyFlex > 0 && (
          <FlexWidget
            style={{
              flex: emptyFlex,
              height: 6,
            }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

function TrendIndicator({
  steps,
  yesterdaySteps,
}: {
  steps: number;
  yesterdaySteps: number;
}) {
  const isUp = steps >= yesterdaySteps;
  const arrow = isUp ? "\u2191" : "\u2193";
  const color = isUp ? "#22c55e" : "#ef4444";

  const diff = Math.abs(steps - yesterdaySteps);
  const label =
    yesterdaySteps === 0
      ? `${arrow} --`
      : `${arrow} ${diff.toLocaleString("en-US")} vs yesterday`;

  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
      }}
    >
      <TextWidget
        text={label}
        style={{
          fontSize: 11,
          color,
        }}
      />
    </FlexWidget>
  );
}

export function StepsWidget({
  config,
  steps = 0,
  yesterdaySteps = 0,
}: StepsWidgetProps) {
  const resolvedConfig = config ?? DEFAULT_STEPS_CONFIG;

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: "mytrack://activities" }}
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#020618",
        borderRadius: 16,
        padding: 16,
        width: "match_parent",
        height: "match_parent",
      }}
    >
      {/* Card container */}
      <FlexWidget
        style={{
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#1d293d",
          borderRadius: 12,
          padding: 16,
          width: "match_parent",
        }}
      >
        {/* Step count */}
        <TextWidget
          text={formatSteps(steps)}
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#ffffff",
          }}
        />

        {/* Label */}
        <TextWidget
          text="Steps today"
          style={{
            fontSize: 13,
            color: "#94a3b8",
            marginTop: 2,
          }}
        />

        {/* Trend indicator */}
        {resolvedConfig.showTrend && (
          <TrendIndicator steps={steps} yesterdaySteps={yesterdaySteps} />
        )}

        {/* Goal progress bar */}
        {resolvedConfig.showGoal && (
          <GoalBar steps={steps} dailyGoal={resolvedConfig.dailyGoal} />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

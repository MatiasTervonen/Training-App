import { FlexWidget, TextWidget, SvgWidget } from "react-native-android-widget";
import type { StepsConfig } from "@/features/widgets/widget-constants";
import { DEFAULT_STEPS_CONFIG } from "@/features/widgets/widget-constants";

const COLORS = {
  background: "#020618",
  text: "#ffffff",
  subtext: "#94a3b8",
  goalComplete: "#22c55e",
  goalInProgress: "#3b82f6",
  progressBarBackground: "#334155",
} as const;

const STEPS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${COLORS.subtext}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/></svg>`;

interface StepsWidgetProps {
  config?: StepsConfig;
  steps?: number;
}

function formatSteps(count: number): string {
  if (count >= 1000) {
    return count.toLocaleString("en-US");
  }
  return String(count);
}

function ProgressBar({
  steps,
  dailyGoal,
}: {
  steps: number;
  dailyGoal: number;
}) {
  const percentage = Math.min(Math.round((steps / dailyGoal) * 100), 100);
  const fillFlex = Math.max(percentage, 1);
  const emptyFlex = Math.max(100 - percentage, 0);
  const fillColor =
    percentage >= 100 ? COLORS.goalComplete : COLORS.goalInProgress;

  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        width: "match_parent",
        height: 10,
        backgroundColor: COLORS.progressBarBackground,
        borderRadius: 5,
      }}
    >
      {fillFlex > 0 && (
        <FlexWidget
          style={{
            flex: fillFlex,
            height: 10,
            backgroundColor: fillColor,
            borderRadius: 5,
          }}
        />
      )}
      {emptyFlex > 0 && (
        <FlexWidget
          style={{
            flex: emptyFlex,
            height: 10,
          }}
        />
      )}
    </FlexWidget>
  );
}

function GoalBar({
  steps,
  dailyGoal,
}: {
  steps: number;
  dailyGoal: number;
}) {
  const percentage = Math.min(Math.round((steps / dailyGoal) * 100), 100);

  return (
    <FlexWidget
      style={{
        flexDirection: "column",
        width: "match_parent",
        marginTop: 2,
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: "row",
          width: "match_parent",
          justifyContent: "space-between",
          marginBottom: 2,
        }}
      >
        <TextWidget
          text={`Goal: ${dailyGoal.toLocaleString("en-US")}`}
          style={{
            fontSize: 11,
            color: COLORS.subtext,
          }}
        />
        <TextWidget
          text={`${percentage}%`}
          style={{
            fontSize: 11,
            color: percentage >= 100 ? COLORS.goalComplete : COLORS.subtext,
            fontWeight: "bold",
          }}
        />
      </FlexWidget>
      <ProgressBar steps={steps} dailyGoal={dailyGoal} />
    </FlexWidget>
  );
}

export function StepsWidget({
  config,
  steps = 0,
}: StepsWidgetProps) {
  const resolvedConfig = config ?? DEFAULT_STEPS_CONFIG;

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: "mytrack://activities" }}
      style={{
        flexDirection: "column",
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 12,
        width: "match_parent",
        height: "match_parent",
      }}
    >
      {/* Icon + steps number on one row */}
      <FlexWidget
        style={{
          flexDirection: "row",
          flex: 1,
          width: "match_parent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SvgWidget
          svg={STEPS_ICON}
          style={{ width: 22, height: 22 }}
        />
        <FlexWidget
          style={{
            flex: 1,
            alignItems: "center",
          }}
        >
          <TextWidget
            text={formatSteps(steps)}
            style={{
              fontSize: 36,
              fontWeight: "bold",
              color: COLORS.text,
            }}
          />
        </FlexWidget>
        {/* Invisible spacer to balance icon width */}
        <FlexWidget style={{ width: 22, height: 1 }} />
      </FlexWidget>

      {/* Goal bar at bottom */}
      {resolvedConfig.showGoal && (
        <GoalBar steps={steps} dailyGoal={resolvedConfig.dailyGoal} />
      )}
    </FlexWidget>
  );
}

import { FlexWidget, SvgWidget } from "react-native-android-widget";
import type { WidgetInfo } from "react-native-android-widget";
import type { QuickLinksConfig } from "@/features/widgets/widget-constants";
import { LINK_TARGETS } from "@/features/widgets/widget-constants";

interface QuickLinksWidgetProps {
  config: QuickLinksConfig;
  widgetInfo: WidgetInfo;
}

const COLORS = {
  background: "#020618",
  buttonBackground: "#1e40af", // blue-800
  buttonBorder: "#3b82f6", // blue-500
} as const;

const ICON_SIZE = 32;
const BUTTON_SIZE = 56;

function IconButton({ iconSvg, route }: { iconSvg: string; route: string }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `mytrack://${route}` }}
      style={{
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.buttonBackground,
        borderColor: COLORS.buttonBorder,
        borderWidth: 2,
        borderRadius: BUTTON_SIZE / 2,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        marginLeft: 6,
        marginRight: 6,
      }}
    >
      <SvgWidget
        svg={iconSvg}
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
        }}
      />
    </FlexWidget>
  );
}

export function QuickLinksWidget({
  config,
  widgetInfo,
}: QuickLinksWidgetProps) {
  const selectedTargets = LINK_TARGETS.filter((target) =>
    config.selectedLinks.includes(target.key),
  );

  // Calculate how many icons fit in one row based on widget width
  const itemWidth = BUTTON_SIZE + 12; // button + margins
  const availableWidth = widgetInfo.width - 16; // minus container padding
  const maxItems = Math.max(1, Math.floor(availableWidth / itemWidth));
  const visibleTargets = selectedTargets.slice(0, maxItems);

  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        width: "match_parent",
        height: "match_parent",
        backgroundColor: COLORS.background,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      {visibleTargets.map((target) => (
        <IconButton
          key={target.key}
          iconSvg={target.iconSvg}
          route={target.route}
        />
      ))}
    </FlexWidget>
  );
}

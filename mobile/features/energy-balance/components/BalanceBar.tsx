import { View } from "react-native";
import Svg, { Rect, Line, ClipPath, Defs } from "react-native-svg";

type BalanceBarProps = {
  balance: number;
  tdee: number;
};

export default function BalanceBar({ balance, tdee }: BalanceBarProps) {
  const width = 280;
  const height = 20;
  const centerX = width / 2;
  const maxRange = Math.max(tdee, 1);

  // Clamp fill to at most half the bar width
  const ratio = Math.min(Math.abs(balance) / maxRange, 1);
  const fillWidth = ratio * (width / 2);

  const isDeficit = balance < 0;
  const fillColor = isDeficit ? "#22c55e" : "#f59e0b";

  return (
    <View className="items-center">
      <Svg width={width} height={height}>
        <Defs>
          <ClipPath id="leftHalf">
            <Rect x={0} y={0} width={centerX} height={height} />
          </ClipPath>
          <ClipPath id="rightHalf">
            <Rect x={centerX} y={0} width={centerX} height={height} />
          </ClipPath>
        </Defs>
        {/* Background */}
        <Rect
          x={0}
          y={2}
          width={width}
          height={height - 4}
          rx={6}
          fill="#1e293b"
        />
        {/* Fill bar — rounded on outer edge, extended past center so clip makes inner edge flat */}
        {isDeficit ? (
          <Rect
            x={centerX - fillWidth}
            y={2}
            width={fillWidth + 6}
            height={height - 4}
            rx={6}
            fill={fillColor}
            opacity={0.7}
            clipPath="url(#leftHalf)"
          />
        ) : (
          <Rect
            x={centerX - 6}
            y={2}
            width={fillWidth + 6}
            height={height - 4}
            rx={6}
            fill={fillColor}
            opacity={0.7}
            clipPath="url(#rightHalf)"
          />
        )}
        {/* Center line */}
        <Line
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={height}
          stroke="#94a3b8"
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}

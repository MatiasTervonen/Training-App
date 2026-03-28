"use client";

type BalanceBarProps = {
  balance: number;
  tdee: number;
};

export default function BalanceBar({ balance, tdee }: BalanceBarProps) {
  const width = 280;
  const height = 20;
  const centerX = width / 2;
  const maxRange = Math.max(tdee, 1);

  const ratio = Math.min(Math.abs(balance) / maxRange, 1);
  const fillWidth = ratio * (width / 2);

  const isDeficit = balance < 0;
  const fillColor = isDeficit ? "#22c55e" : "#f59e0b";

  return (
    <div className="flex justify-center">
      <svg width={width} height={height}>
        <defs>
          <clipPath id="leftHalf">
            <rect x={0} y={0} width={centerX} height={height} />
          </clipPath>
          <clipPath id="rightHalf">
            <rect x={centerX} y={0} width={centerX} height={height} />
          </clipPath>
        </defs>
        {/* Background */}
        <rect
          x={0}
          y={2}
          width={width}
          height={height - 4}
          rx={6}
          fill="#1e293b"
        />
        {/* Fill bar */}
        {isDeficit ? (
          <rect
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
          <rect
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
        <line
          x1={centerX}
          y1={0}
          x2={centerX}
          y2={height}
          stroke="#94a3b8"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

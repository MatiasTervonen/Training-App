import { useMemo } from "react";
import { useWeightShareData } from "@/features/weight/components/WeightShareCard";
import { weight } from "@/types/session";
import { ShareCardTheme } from "@/lib/share/themes";

/**
 * Builds the echarts option and generates the HTML for rendering
 * a chart in a WebView with canvas renderer, then exports as PNG data URL.
 */
export default function useChartImage(
  range: "week" | "month" | "year",
  data: weight[],
  locale: string,
  theme?: ShareCardTheme,
) {
  const { chartData } = useWeightShareData(range, data, locale);

  const values = chartData
    .map((item) => item.value)
    .filter((v): v is number => v !== null);
  const uniqueValues = new Set(values).size;
  const minWeight = values.length > 0 ? Math.min(...values) : 0;
  const maxWeight = values.length > 0 ? Math.max(...values) : 100;

  const isLightTheme = theme?.id === "clean";
  const labelColor = isLightTheme ? theme.colors.textPrimary : "#f3f4f6";
  const gridColor = theme?.colors.textMuted ?? "#9ca3af";

  const html = useMemo(() => {
    const option = {
      backgroundColor: "transparent",
      animation: false,
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.label),
        axisLabel: {
          color: labelColor,
          fontSize: 24,
        },
      },
      yAxis: {
        type: "value",
        min: Math.floor(minWeight) - 1,
        max: Math.round(maxWeight) + 1,
        splitLine: {
          show: true,
          lineStyle: {
            color: gridColor,
            width: 0.5,
            type: "dashed",
          },
        },
        axisLabel: {
          color: labelColor,
          fontSize: 24,
        },
      },
      series: [
        {
          data: chartData.map((item) => item.value),
          type: "line",
          smooth: true,
          showSymbol: uniqueValues <= 1,
          symbolSize: 14,
          lineStyle: {
            color: "#93c5fd",
            width: 5,
          },
          itemStyle: {
            color: "#3b82f6",
            borderColor: "#60a5fa",
            borderWidth: 3,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(56, 189, 248, 0.4)" },
                { offset: 1, color: "rgba(56, 189, 248, 0.05)" },
              ],
            },
          },
        },
      ],
      grid: { top: 20, right: 10, bottom: 40, left: 50 },
    };

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=960,initial-scale=1,user-scalable=no">
<style>html,body{margin:0;padding:0;width:960px;height:620px;background:transparent;overflow:hidden;}#chart{width:960px;height:620px;}</style>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
</head>
<body>
<div id="chart"></div>
<script>
var chart=echarts.init(document.getElementById('chart'),null,{renderer:'canvas',width:960,height:620});
chart.setOption(${JSON.stringify(option)});
setTimeout(function(){
  var url=chart.getDataURL({type:'png',pixelRatio:2,backgroundColor:'transparent'});
  window.ReactNativeWebView.postMessage(url);
},200);
</script>
</body>
</html>`;
  }, [chartData, minWeight, maxWeight, uniqueValues, labelColor, gridColor]);

  return html;
}

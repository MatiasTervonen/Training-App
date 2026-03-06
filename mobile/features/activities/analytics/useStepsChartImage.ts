import { useMemo } from "react";
import { useStepsShareData } from "@/features/activities/analytics/StepsShareCard";
import { StepRecord } from "@/database/activities/get-steps";

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
}

export default function useStepsChartImage(
  range: "week" | "month" | "3months",
  data: StepRecord[],
  todaySteps: number,
  locale: string,
) {
  const { chartData } = useStepsShareData(range, data, todaySteps, locale);

  const values = chartData.map((item) => item.value);
  const maxSteps = Math.max(...values, 1000);

  const html = useMemo(() => {
    const option = {
      backgroundColor: "transparent",
      animation: false,
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.label),
        axisLabel: {
          color: "#f3f4f6",
          fontSize: 24,
          interval: range === "month" ? 4 : 0,
        },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: Math.ceil(maxSteps / 1000) * 1000,
        splitLine: {
          show: true,
          lineStyle: {
            color: "#374151",
            width: 1,
            type: "dashed",
          },
        },
        axisLabel: {
          color: "#9ca3af",
          fontSize: 24,
          formatter: `function(v){return v>=1000?(v/1000).toFixed(1).replace(/\\.0$/,'')+'k':v+''}`,
        },
      },
      series: [
        {
          data: chartData.map((item) => item.value),
          type: "bar",
          barWidth: range === "week" ? "60%" : range === "month" ? "70%" : "80%",
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#22c55e" },
                { offset: 1, color: "#16a34a" },
              ],
            },
            borderRadius: [8, 8, 0, 0],
          },
        },
      ],
      grid: { top: 30, right: 40, bottom: 50, left: 80 },
    };

    // Build the option JSON but replace the formatter string with an actual function
    const optionJson = JSON.stringify(option);
    const fixedJson = optionJson.replace(
      /"formatter":"function\(v\)\{return v>=1000\?\(v\/1000\)\.toFixed\(1\)\.replace\(\/\\\\.0\$\/,''\)\+'k':v\+''\}"/,
      `"formatter":function(v){return v>=1000?(v/1000).toFixed(1).replace(/\\.0$/,'')+'k':v+''}`,
    );

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
chart.setOption(${fixedJson});
setTimeout(function(){
  var url=chart.getDataURL({type:'png',pixelRatio:2,backgroundColor:'transparent'});
  window.ReactNativeWebView.postMessage(url);
},200);
</script>
</body>
</html>`;
  }, [chartData, maxSteps, range]);

  return html;
}

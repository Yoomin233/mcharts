import { CommonChartOptions, ChartDataStruct, BarChartOptions, PieChartOptions, LineChartOptions } from "index";
import { mergeSettings } from "./tools";

export const defaultChartSettings: CommonChartOptions = {
  mountNode: document.querySelector("body"),
  width: 800,
  height: 500,
  dpi: 2,

  colors: ["#0E4AB3", "#1B68D9", "#2F88FF", "#57A5FF", "#A8D7FF", "#D1EBFF", "#F1F9FF"],
  textOptions: {
    size: 12,
    color: "#666"
  },
  lineOptions: {
    width: 1,
    color: "#666"
  },
  scaleOptions: {
    width: 1,
    color: "#666",
    dash: [15, 15]
  },
  toolTip: {
    renderer: (data: ChartDataStruct, x: number, y: number) => `<div style='left: ${x}px;bottom: ${y}px'>${data.item}: ${data.value}</div>`,
    color: ["red"]
  }
};

export const defaultBarChartSettings: BarChartOptions = Object.assign(
  {
    datas: [],
    usePercentage: false,
    drawScale: {
      x: true,
      y: true
    },
    barStyle: {
      width: 10,
      color: "#666",
      lineCap: "round"
    },
    scalePaddingLeft: 48
  },
  defaultChartSettings
);

export const defaultPieChartSettings: PieChartOptions = Object.assign(
  {
    datas: [],
    radius: {
      inner: 200,
      outer: 400
    },
    startAngle: 0,
    gap: 0,
    legends: true
  },
  defaultChartSettings
);

export const defaultLineChartSettings: LineChartOptions = mergeSettings(
  {
    datas: [],
    drawScale: {
      x: true,
      y: true
    },
    scalePaddingLeft: 48,
    scaleOptions: {
      x: {
        format: "MM-DD",
        tip: false
      }
    }
  },
  defaultChartSettings
);

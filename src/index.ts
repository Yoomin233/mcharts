import "./common.module.less";

import BarChart from "./charts/bar";
import PieChart from "./charts/pie";
import LineChart from "./charts/line";

export interface ChartDataStruct {
  item: string;
  value: number;
}

export interface CommonChartOptions {
  mountNode?: Element;
  width?: number;
  height?: number;
  dpi?: number;

  colors?: string[];
  textOptions?: {
    size?: number;
    color?: string;
  };
  lineOptions?: {
    width?: number;
    color?: string;
  };
  scaleOptions?: {
    width?: number;
    color?: string;
    dash?: [number, number];
    // scaleOptions?: {
    x?: {
      format?: string;
      tip?: boolean;
    };
    // }
  };
  toolTip?: {
    renderer?: (data: ChartDataStruct, x: number, y: number) => string;
    color?: string[];
  };
}

export interface BarChartOptions extends CommonChartOptions {
  datas?: ChartDataStruct[];
  usePercentage?: boolean; // 是否使用百分比
  drawScale?: {
    x?: boolean;
    y?: boolean;
  }; // 是否显示刻度
  barStyle: {
    width?: number;
    color?: string;
    lineCap: CanvasLineCap | string;
  };
  scalePaddingLeft: number;
}

export interface PieChartOptions extends CommonChartOptions {
  datas?: ChartDataStruct[];
  radius: {
    inner: number;
    outer: number;
  };
  startAngle: number;
  gap?: number;
  legends: boolean;
}

export interface LineChartDataStruct {
  time: number;
  value: number;
  item?: string;
}

export interface LineChartOptions extends CommonChartOptions {
  datas: LineChartDataStruct[];
  drawScale?: {
    x?: boolean;
    y?: boolean;
  }; // 是否显示刻度
  scalePaddingLeft: number;
}

const width = window.innerWidth;

// window.barChart = new BarChart({
//   mountNode: document.querySelector("#root"),
//   datas: [{ item: "播放", value: 10 }, { item: "点赞", value: 10 }, { item: "点赞", value: 28 }, { item: "点赞", value: 28 }],
//   height: width * 0.8,
//   width: width * 0.8,
//   textOptions: {
//     size: 16
//   },
//   lineOptions: {
//     width: 1,
//     color: "#fff"
//   },
//   colors: ["#0FFCF5"],
//   usePercentage: true,
//   drawScale: {
//     x: true,
//     y: false
//   },
//   barStyle: {
//     width: width * 0.18,
//     lineCap: "square"
//   },
//   scalePaddingLeft: 0
// });

// window.pieChart = new PieChart({
//   mountNode: document.querySelector("#root"),
//   datas: [
//     { item: "播放", value: 10 },
//     { item: "点赞", value: 10 },
//     { item: "点赞", value: 28 },
//     { item: "点赞", value: 28 },
//     { item: "点赞", value: 28 },
//     { item: "点赞", value: 5 }
//   ],
//   height: width * 0.8,
//   width: width * 0.9,
//   textOptions: {
//     size: 16
//   },
//   lineOptions: {
//     width: 1
//   },
//   radius: {
//     inner: width * 0.2,
//     outer: width * 0.3
//   },
//   startAngle: 0,
//   gap: Math.PI / 100,
//   legends: true
// });

const lineChartSettings = {
  mountNode: document.querySelector("#root"),
  colors: ["#0FFCF5"],
  datas: Array.from({ length: 30 }).map((_, index) => ({
    item: `播放${index}`,
    value: Math.random(),
    time: 1554120768876
  })),
  height: width * 0.8,
  width: width * 0.9,
  textOptions: {
    size: 16
  },
  lineOptions: {
    width: 3
  },
  scalePaddingLeft: 0,
  drawScale: {
    x: true,
    y: false
  },
  toolTip: {
    color: ["rgba(15,252,245,0.80)"]
  }
};

// console.log(lineChartSettings);

window.lineChart = new LineChart(lineChartSettings);

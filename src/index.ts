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
    gradient?: [number, string][];
    bezierCurve?: boolean;
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

const lineChartSettings: LineChartOptions = {
  mountNode: document.querySelector("#root"),
  colors: ["red"],
  datas: [
    { item: "播放0", value: 4.06974592501931, time: 1554120768876 },
    { item: "播放1", value: 1.258310528188843, time: 1554120768876 },
    { item: "播放2", value: 4.487198864924272, time: 1554120768876 },
    { item: "播放3", value: 2.5257653848128547, time: 1554120768876 },
    { item: "播放4", value: 0.9268780322951775, time: 1554120768876 },
    { item: "播放5", value: 0.07358710719595485, time: 1554120768876 },
    { item: "播放6", value: 1.4428415276032547, time: 1554120768876 },
    { item: "播放7", value: 4.966146769870501, time: 1554120768876 },
    { item: "播放8", value: 3.5032981745273997, time: 1554120768876 },
    { item: "播放9", value: 2.7858088997177877, time: 1554120768876 },
    { item: "播放10", value: 2.7384762135042062, time: 1554120768876 },
    { item: "播放11", value: 2.0829781335659927, time: 1554120768876 },
    { item: "播放12", value: 0.580843675839271, time: 1554120768876 },
    { item: "播放13", value: 0.6517889124018694, time: 1554120768876 },
    { item: "播放14", value: 1.8098070479347639, time: 1554120768876 },
    { item: "播放15", value: 4.046090065662322, time: 1554120768876 },
    { item: "播放16", value: 4.447353743503111, time: 1554120768876 },
    { item: "播放17", value: 3.749894842933188, time: 1554120768876 },
    { item: "播放18", value: 4.95052673211264, time: 1554120768876 },
    { item: "播放19", value: 3.668258770718925, time: 1554120768876 },
    { item: "播放20", value: 3.6376851717879854, time: 1554120768876 },
    { item: "播放21", value: 2.7812990907869937, time: 1554120768876 },
    { item: "播放22", value: 1.0556948239352304, time: 1554120768876 },
    { item: "播放23", value: 2.9876119657760603, time: 1554120768876 },
    { item: "播放24", value: 2.852370880871198, time: 1554120768876 },
    { item: "播放25", value: 2.183472153761402, time: 1554120768876 },
    { item: "播放26", value: 4.375492403702539, time: 1554120768876 },
    { item: "播放27", value: 1.761968038003392, time: 1554120768876 },
    { item: "播放28", value: 0.923624386728068, time: 1554120768876 },
    { item: "播放29", value: 2.36674609667738, time: 1554120768876 }
  ],
  height: width * 0.8,
  width: width * 0.9,
  textOptions: {
    size: 16
  },
  lineOptions: {
    width: 4,
    gradient: [],
    bezierCurve: true
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

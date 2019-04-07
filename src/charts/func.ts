import { BarChartOptions } from "index";
import { TransformContextCoordinates, drawLine } from "../tools";

export default class FuncChart {
  options: any;
  wrapperElement: HTMLDivElement;
  scaleCtx: CanvasRenderingContext2D;
  chartCtx: CanvasRenderingContext2D;

  width: number;
  height: number;

  positions: ClientRect | DOMRect;

  /**
   * merge选项, 创建元素....etc
   * @param settings CommonChartOptions
   */
  constructor(settings: { mountNode: HTMLElement }) {
    if (!settings.mountNode) {
      return;
    }

    let options = { width: 500, height: 500, dpi: 2 };
    this.options = options;
    // create wrapper element and set styles
    const wrapperElement = document.createElement("div");
    wrapperElement.className = "mcharts-wrapper";
    wrapperElement.style.width = `${options.width}px`;
    wrapperElement.style.height = `${options.height}px`;
    this.wrapperElement = wrapperElement;

    // create scale element canvas
    const scaleCanvasElement = document.createElement("canvas");
    // create chart element canvas
    const chartCanvasElement = document.createElement("canvas");

    // set dimensions
    chartCanvasElement.width = scaleCanvasElement.width = options.width * options.dpi;
    chartCanvasElement.height = scaleCanvasElement.height = options.height * options.dpi;
    this.width = options.width;
    this.height = options.height;

    // append...
    this.wrapperElement.appendChild(scaleCanvasElement);
    this.wrapperElement.appendChild(chartCanvasElement);
    settings.mountNode.appendChild(this.wrapperElement);

    // const xrx = scaleCanvasElement.getContext('2d')
    // set canvas context and coordinates transformer
    // 将canvas坐标系转换为笛卡尔坐标系
    this.scaleCtx = TransformContextCoordinates(
      scaleCanvasElement.getContext("2d"),
      x => (x + this.width / 2) * this.options.dpi,
      y => (this.height / 2 - y) * this.options.dpi
    );
    this.chartCtx = TransformContextCoordinates(
      chartCanvasElement.getContext("2d"),
      x => (x + this.width / 2) * this.options.dpi,
      y => (this.height / 2 - y) * this.options.dpi
    );

    // this.scaleCtx.strokeStyle = "#000";
    // this.scaleCtx.moveTo(0, 0);
    // this.scaleCtx.lineTo(100, 100);
    // this.scaleCtx.stroke();
    this.drawScales();
    return this;
  }
  rerender(newDatas: { value: number; item: string }[]) {
    this.options.datas = newDatas;

    this.scaleCtx.beginPath();
    this.scaleCtx.clearRect(0, this.height, this.width, this.height);

    this.drawScales();
  }
  /**
   * 画坐标轴
   */
  drawScales() {
    drawLine(this.scaleCtx, [[0, this.height / 2], [0, -this.height / 2]]);
    drawLine(this.scaleCtx, [[-this.width / 2, 0], [this.width / 2, 0]]);
    this.drawFunc();
  }
  drawFunc() {
    const func = x => Math.log(x);
    // const func2 = x => -500 / 2;

    // this.chartCtx.moveTo(-this.width / 2, func(-this.width / 2));
    // for (let i = -this.width / 2 + 1; i < this.width / 2; i++) {
    //   this.chartCtx.lineTo(i, func(i));
    //   this.chartCtx.stroke();
    //   console.log(i, func(i));
    // }
    this.chartCtx.moveTo(0, 0);

    for (let i = 0; i < 100; i++) {
      this.chartCtx.lineTo(i ** 2, 2 * i);
      this.chartCtx.stroke();
      // console.log(i, func(i));
    }
    this.chartCtx.moveTo(0, 0);

    for (let i = 0; i > -100; i--) {
      this.chartCtx.lineTo(i ** 2, 2 * i);
      this.chartCtx.stroke();
      // console.log(i, func(i));
    }
  }
}

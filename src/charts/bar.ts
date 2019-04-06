import { BarChartOptions } from "index";
import * as Tools from "../tools";
import { defaultChartSettings, defaultBarChartSettings } from "../consts";
import { TransformContextCoordinates } from "../tools";

export default class BarChart {
  options: BarChartOptions;
  wrapperElement: HTMLDivElement;
  scaleCtx: CanvasRenderingContext2D;
  chartCtx: CanvasRenderingContext2D;
  tooltipCtx: CanvasRenderingContext2D;

  highestYScale: number;
  yScaleCoordinates: [[number, number]?] = [];
  xScaleCoordinates: [[number, number]?] = [];
  registeredBarAreas: {
    areas: [[number, number], [number, number]];
    data: { value: number; item: string };
  }[] = [];

  width: number;
  height: number;

  private _scalePaddingLeft: number;
  public get scalePaddingLeft(): number {
    return this._scalePaddingLeft;
  }
  public set scalePaddingLeft(value: number) {
    this._scalePaddingLeft = value;
  }
  scalePaddingBottom: number;
  scalePaddingTop: number;

  ySpaceAvailableForBar: number;

  positions: ClientRect | DOMRect;

  /**
   * merge选项, 创建元素....etc
   * @param settings CommonChartOptions
   */
  constructor(settings: BarChartOptions) {
    if (!settings.mountNode) {
      return;
    }
    // set options
    const options: BarChartOptions = Tools.mergeSettings(settings, defaultBarChartSettings);
    options.colors = options.colors.concat(defaultChartSettings.colors);
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
    // create tooltip element canvas
    const tooltipCanvasElement = document.createElement("canvas");

    // if (options.drawScale === false) {
    // scaleCanvasElement.style.display = "none";
    // }

    // set dimensions
    chartCanvasElement.width = scaleCanvasElement.width = tooltipCanvasElement.width = options.width * options.dpi;
    chartCanvasElement.height = scaleCanvasElement.height = tooltipCanvasElement.height = options.height * options.dpi;
    this.width = options.width;
    this.height = options.height;

    // append...
    this.wrapperElement.appendChild(scaleCanvasElement);
    this.wrapperElement.appendChild(chartCanvasElement);
    this.wrapperElement.appendChild(tooltipCanvasElement);
    settings.mountNode.appendChild(this.wrapperElement);

    // set canvas context and coordinates transformer
    // 将canvas坐标系转换为笛卡尔坐标系
    this.scaleCtx = TransformContextCoordinates(
      scaleCanvasElement.getContext("2d"),
      x => x * this.options.dpi,
      y => (this.height - y) * this.options.dpi
    );
    this.chartCtx = TransformContextCoordinates(
      chartCanvasElement.getContext("2d"),
      x => x * this.options.dpi,
      y => (this.height - y) * this.options.dpi
    );
    this.tooltipCtx = TransformContextCoordinates(
      tooltipCanvasElement.getContext("2d"),
      x => x * this.options.dpi,
      y => (this.height - y) * this.options.dpi
    );
    // 改写参数值
    // options.textOptions.size *= options.dpi;
    options.lineOptions.width *= options.dpi;
    options.scaleOptions.width *= options.dpi;
    options.barStyle.width *= options.dpi;

    // 添加鼠标事件
    // if (navigator.maxTouchPoints) {
    wrapperElement.addEventListener("touchstart", this.handleTouchStart);
    // } else {
    wrapperElement.addEventListener("mousemove", this.handleMouseMove);
    // }
    // draw scales
    this.drawScales();
    requestAnimationFrame(() => {
      this.positions = chartCanvasElement.getBoundingClientRect();
    });
    return this;
  }
  rerender(newDatas: { value: number; item: string }[]) {
    this.options.datas = newDatas;
    this.xScaleCoordinates = [];
    this.yScaleCoordinates = [];
    this.registeredBarAreas = [];
    this.scaleCtx.beginPath();
    this.scaleCtx.clearRect(0, this.height, this.width, this.height);
    this.chartCtx.beginPath();
    this.chartCtx.clearRect(0, this.height, this.width, this.height);
    this.tooltipCtx.beginPath();
    this.tooltipCtx.clearRect(0, this.height, this.width, this.height);
    this.drawScales();
  }
  /**
   * 画坐标轴
   */
  drawScales() {
    const { scaleCtx } = this;
    const { datas, drawScale, textOptions, scalePaddingLeft } = this.options;
    const textSize = this.options.textOptions.size;
    this.scalePaddingLeft = scalePaddingLeft;
    this.scalePaddingTop = textOptions.size * 2;
    this.scalePaddingBottom = textOptions.size * 3;
    // x, y坐标轴初始线
    this.scaleCtx.strokeStyle = this.options.scaleOptions.color;
    drawScale.x && Tools.drawLine(scaleCtx, [[this.scalePaddingLeft, this.scalePaddingBottom], [this.width, this.scalePaddingBottom]]);
    drawScale.y &&
      Tools.drawLine(scaleCtx, [
        [this.scalePaddingLeft, this.scalePaddingBottom],
        [this.scalePaddingLeft, this.height - this.scalePaddingTop]
      ]);
    // y坐标
    this.highestYScale = Tools.getNearest5BasedNumber(Math.max.apply(Math, datas.map(d => d.value)));
    // 刻度数字间距
    const yScaleInterval = this.highestYScale / 4;
    // 总y刻度可用空间
    this.ySpaceAvailableForBar = this.height - this.scalePaddingBottom - textSize / 2 - this.scalePaddingTop;
    // 刻度距离间距
    const ySpaceInterval = this.ySpaceAvailableForBar / 4;
    scaleCtx.textAlign = "right";
    // 文字稍微放小一点点
    scaleCtx.font = `${textOptions.size * this.options.dpi * 0.9}px Arial`;
    scaleCtx.fillStyle = textOptions.color;
    // y坐标, 暂定固定为5个
    Array.from({ length: 5 }).forEach((_, index) => {
      const yPos = this.scalePaddingBottom + ySpaceInterval * index;
      if (index !== 0 && drawScale.y) {
        Tools.drawLine(scaleCtx, [[this.scalePaddingLeft, yPos], [this.width, yPos]], [15, 5]);
      }
      this.yScaleCoordinates.push([this.scalePaddingLeft, yPos]);
      drawScale.y && scaleCtx.fillText(String(Math.floor(yScaleInterval * index)), this.scalePaddingLeft - 10, yPos - textSize / 2);
    });
    // 计算x坐标刻度的可用空间
    const xRemainingSpace = Math.min(
      (this.width - this.scalePaddingLeft) * 0.9,
      this.width - this.scalePaddingLeft - this.options.barStyle.width / this.options.dpi
    );
    // console.log(xRemainingSpace);
    // x坐标刻度的间距
    const xInterval = xRemainingSpace / (datas.length - 1);
    // 开始画x刻度的y坐标
    const startY = this.scalePaddingBottom;
    // 结束画x刻度的y坐标
    const endY = this.scalePaddingBottom - textSize / 2;
    // y刻度下的小线段
    drawScale.y && Tools.drawLine(this.scaleCtx, [[this.scalePaddingLeft, startY], [this.scalePaddingLeft, endY]]);
    for (let i = 0; i < datas.length; i++) {
      // 确定开始画x刻度的坐标
      const x = this.scalePaddingLeft + Math.max(this.width * 0.05, this.options.barStyle.width / this.options.dpi / 2) + xInterval * i;
      drawScale.x && Tools.drawLine(this.scaleCtx, [[x, startY], [x, endY]]);
      drawScale.x && scaleCtx.fillText(datas[i].item, x + (Tools.calculateTextLength(datas[i].item) * textSize) / 2, endY - textSize * 1.5);
      this.xScaleCoordinates.push([x, startY]);
    }
    this.drawBars();
  }
  /**
   * 画柱状图
   */
  drawBars() {
    const { datas } = this.options;
    const { width: barWidth } = this.options.barStyle;
    // const xScaleInterval =
    this.chartCtx.strokeStyle = this.options.colors[0];
    this.chartCtx.lineWidth = barWidth;
    this.chartCtx.lineCap = this.options.barStyle.lineCap as CanvasLineCap;
    const startY = this.scalePaddingBottom;
    this.xScaleCoordinates.forEach((coord, index) => {
      const x = coord[0];
      const endY = this.scalePaddingBottom + (datas[index].value / this.highestYScale) * this.ySpaceAvailableForBar;
      // Tools.drawLine(this.chartCtx, [[x, startY + barWidth / 4], [x, endY - barWidth / 4]]);
      if (datas[index].value !== 0) {
        setTimeout(() => {
          this.animateBar(x, startY + barWidth / 4, endY - barWidth / 4);
        }, 200 * index);
      }
      this.registeredBarAreas.push({
        areas: [[x - barWidth / 4, startY], [x + barWidth / 4, datas[index].value === 0 ? startY + 100 : endY]],
        data: datas[index]
      });
    });
  }
  animateBar(
    xPos: number,
    start: number,
    end: number,
    currentPos = start + 4,
    iterationCount = 0,
    totalIteration = Math.floor((start - end) / 4)
  ) {
    // console.log("animated");
    const { chartCtx } = this;
    // const thisIterationEndingY = start - 1;
    chartCtx.moveTo(xPos, start);
    chartCtx.lineTo(xPos, currentPos);
    chartCtx.stroke();
    if (currentPos <= end) {
      requestAnimationFrame(() => {
        this.animateBar(xPos, start, end, currentPos + 4, iterationCount + 1, totalIteration);
      });
    }
  }
  handleMouseMove = (e: MouseEvent) => {
    const offsetY = this.height - e.offsetY;
    const offsetX = e.offsetX;
    // const startY = this.scalePaddingBottom;
    for (let i = 0; i < this.registeredBarAreas.length; i++) {
      const ifInArea = Tools.ifPointInArea(offsetX, offsetY, this.registeredBarAreas[i].areas);
      if (ifInArea) {
        // const endY = this.scalePaddingBottom + (this.registeredBarAreas[i].data.value / this.highestYScale) * this.ySpaceAvailableForBar;
        // this.chartCtx.
        console.log(this.registeredBarAreas[i]);
        const area = this.registeredBarAreas[i].areas;
        const xScale = this.xScaleCoordinates[i];
        this.tooltipCtx.lineWidth = this.options.lineOptions.width;
        // 决定线段高度
        const tipY = this.height - this.scalePaddingBottom + this.scalePaddingTop;
        const tipWidth = Tools.calculateTextLength(String(this.registeredBarAreas[i].data.value)) * this.options.textOptions.size;
        Tools.drawLine(this.tooltipCtx, [xScale, [xScale[0], tipY]]);
        this.tooltipCtx.fillText(String(this.registeredBarAreas[i].data.value), xScale[0] - tipWidth / 2, tipY);
        return;
        // break;
      }
    }
    return this.tooltipCtx.clearRect(0, this.height, this.width, this.height - this.scalePaddingBottom);
  };
  /**
   * 画tooltip的线段. 这一块代码有点难看, 需要优化
   */
  handleTouchStart = (e: TouchEvent) => {
    // console.log(e);
    const offsetY = this.height - (e.touches[0].clientY - this.positions.top);
    const offsetX = e.touches[0].clientX - this.positions.left;
    // console.log(offsetX, offsetY);
    // this.chartCtx.fillStyle = "#fff";
    this.tooltipCtx.clearRect(0, this.height, this.width, this.height - this.scalePaddingBottom);
    this.tooltipCtx.setLineDash([15, 15]);

    // this.tooltipCtx.fillStyle = "#000";
    this.tooltipCtx.fillStyle = this.tooltipCtx.strokeStyle = this.options.toolTip.color[0];
    this.tooltipCtx.font = `${this.options.textOptions.size * this.options.dpi * 0.9}px Arial`;

    for (let i = 0; i < this.registeredBarAreas.length; i++) {
      const ifInArea = Tools.ifPointInArea(offsetX, offsetY, this.registeredBarAreas[i].areas);
      if (ifInArea) {
        const area = this.registeredBarAreas[i].areas;
        const xScale = this.xScaleCoordinates[i];
        this.tooltipCtx.lineWidth = this.options.lineOptions.width;
        // 决定线段高度
        const tipY = this.height - this.scalePaddingBottom + this.scalePaddingTop;
        const tipWidth = Tools.calculateTextLength(String(this.registeredBarAreas[i].data.value)) * this.options.textOptions.size;
        Tools.drawLine(this.tooltipCtx, [xScale, [xScale[0], tipY]]);
        this.tooltipCtx.fillText(String(this.registeredBarAreas[i].data.value), xScale[0] - tipWidth / 2, tipY);
        return;
        // break;
      }
    }
    // console.log("clear!");
    return this.tooltipCtx.clearRect(0, this.height, this.width, this.height - this.scalePaddingBottom);
  };
}

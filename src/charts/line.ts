import { LineChartOptions, LineChartDataStruct } from "index";
import * as Tools from "../tools";
import { defaultChartSettings, defaultBarChartSettings, defaultLineChartSettings } from "../consts";
import { TransformContextCoordinates } from "../tools";

type RegisteredPoints = {
  position: [number, number];
  data: LineChartDataStruct;
};

export default class LineChart {
  options: LineChartOptions;
  wrapperElement: HTMLDivElement;
  scaleCtx: CanvasRenderingContext2D;
  chartCtx: CanvasRenderingContext2D;
  tooltipCtx: CanvasRenderingContext2D;

  highestYScale: number;
  yScaleCoordinates: [[number, number]?] = [];
  xScaleCoordinates: [[number, number]?] = [];
  registeredPoints: RegisteredPoints[] = [];

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
  constructor(settings: LineChartOptions) {
    if (!settings.mountNode) {
      return;
    }
    // set options
    // console.log(settings, defaultLineChartSettings)
    const options: LineChartOptions = Tools.mergeSettings(settings, defaultLineChartSettings);
    // options.colors = options.colors.concat(defaultChartSettings.colors);
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
    const xTransformer = x => x * this.options.dpi;
    const yTransformer = y => (this.height - y) * this.options.dpi;
    this.scaleCtx = TransformContextCoordinates(scaleCanvasElement.getContext("2d"), xTransformer, yTransformer);
    this.chartCtx = TransformContextCoordinates(chartCanvasElement.getContext("2d"), xTransformer, yTransformer);
    this.tooltipCtx = TransformContextCoordinates(tooltipCanvasElement.getContext("2d"), xTransformer, yTransformer);
    // 改写参数值
    // options.textOptions.size *= options.dpi;
    options.lineOptions.width *= options.dpi;
    options.scaleOptions.width *= options.dpi;
    // options.barStyle.width *= options.dpi;

    // 添加鼠标事件
    if (navigator.maxTouchPoints) {
      wrapperElement.addEventListener("touchstart", this.handleTouchStart);
    } else {
      // wrapperElement.addEventListener("mousemove", this.handleMouseMove);
    }

    // 计算最大刻度和最大值
    if (Array.isArray(options.datas[0])) {
    } else {
      this.highestYScale = Tools.getNearest5BasedNumber(Math.max.apply(Math, (options.datas as LineChartDataStruct[]).map(d => d.value)));
    }
    // draw scales
    this.drawScales();
    requestAnimationFrame(() => {
      this.positions = chartCanvasElement.getBoundingClientRect();
    });
    return this;
  }
  /**
   * 画坐标轴
   */
  drawScales() {
    const { scaleCtx } = this;
    const { datas, drawScale, textOptions, scalePaddingLeft } = this.options;
    // 设定字体、线宽
    const textSize = this.options.textOptions.size;
    this.scaleCtx.lineWidth = this.options.scaleOptions.width;
    // 总共y刻度的数量(+1)
    const yScaleCount = 5;
    this.scalePaddingLeft = scalePaddingLeft;
    this.scalePaddingTop = textOptions.size * 2;
    this.scalePaddingBottom = textOptions.size * 3;
    // x, y坐标轴初始线
    this.scaleCtx.strokeStyle = this.options.scaleOptions.color;
    this.scaleCtx.setLineDash(this.options.scaleOptions.dash || []);
    drawScale.x && Tools.drawLine(scaleCtx, [[this.scalePaddingLeft, this.scalePaddingBottom], [this.width, this.scalePaddingBottom]]);
    drawScale.y &&
      Tools.drawLine(scaleCtx, [
        [this.scalePaddingLeft, this.scalePaddingBottom],
        [this.scalePaddingLeft, this.height - this.scalePaddingTop]
      ]);

    // 刻度数字
    const yScaleInterval = this.highestYScale / (yScaleCount - 1);
    // 总y刻度可用空间
    this.ySpaceAvailableForBar = this.height - this.scalePaddingBottom - textSize / 2 - this.scalePaddingTop;
    // 刻度距离间距
    const ySpaceInterval = this.ySpaceAvailableForBar / (yScaleCount - 1);
    scaleCtx.textAlign = "right";
    // 文字稍微放小一点点
    scaleCtx.font = `${textOptions.size * this.options.dpi * 0.9}px Arial`;
    scaleCtx.fillStyle = textOptions.color;
    // y坐标, 暂定固定为5个
    drawScale.y &&
      Array.from({ length: 5 }).forEach((_, index) => {
        const yPos = this.scalePaddingBottom + ySpaceInterval * index;
        if (index !== 0) {
          Tools.drawLine(scaleCtx, [[this.scalePaddingLeft, yPos], [this.width, yPos]], [15, 5]);
        }
        this.yScaleCoordinates.push([this.scalePaddingLeft, yPos]);
        scaleCtx.fillText(String(Math.floor(yScaleInterval * index)), this.scalePaddingLeft - 10, yPos - textSize / 2);
      });
    // 计算x坐标刻度的可用空间
    const xRemainingSpace = (this.width - this.scalePaddingLeft) * 0.8;

    // x坐标刻度的间距
    const xInterval = xRemainingSpace / (datas.length - 1);
    // x刻度的y坐标(x轴垂下的小线段)
    const startY = this.scalePaddingBottom;
    // 结束画x刻度的y坐标
    const endY = this.scalePaddingBottom - textSize / 2;
    // 最左边y刻度下的小线段
    drawScale.y && Tools.drawLine(this.scaleCtx, [[this.scalePaddingLeft, startY], [this.scalePaddingLeft, endY]]);
    // 开始画的x刻度的x坐标
    const startX = this.scalePaddingLeft / 2 + (this.width - xRemainingSpace) / 2;
    // 计算可能要省略的x坐标(放不下的情况下)
    const xScaleWidth = Tools.calculateTextLength(this.options.scaleOptions.x.format) * textSize;
    // 要减去头尾的两个xscale
    const xScaleRemainingSpace = xRemainingSpace - xScaleWidth;
    // const minimumDistance =
    const maxXScaleCount = Math.floor(xScaleRemainingSpace / xScaleWidth / 2);
    const xScaleInterval = xScaleRemainingSpace / (maxXScaleCount + 1);
    // console.log(xScaleInterval);

    // const maxScaleCount = Math.floor(xRemainingSpace / xScaleWidth);
    // const scaleSkippedInterval = Math.floor(datas.length / maxScaleCount);
    // console.log(scaleSkippedInterval);
    let latestDrawXScaleXCoordinate: number = 0;
    for (let i = 0; i < datas.length; i++) {
      // 确定开始画x刻度的坐标
      const x = startX + xInterval * i;
      this.xScaleCoordinates.push([x, startY]);
      if (!drawScale.x) {
        continue;
      }
      if (i === 0) {
        // 画x轴下的小tip
        this.options.scaleOptions.x.tip && Tools.drawLine(this.scaleCtx, [[x, startY], [x, endY]]);
        const text = Tools.formatTime(datas[i].time, this.options.scaleOptions.x.format);
        scaleCtx.fillText(
          text,
          x + (Tools.calculateTextLength(text) * textSize) / 2,
          (this.options.scaleOptions.x.tip ? endY : this.scalePaddingBottom) - textSize * 1.5
        );
        latestDrawXScaleXCoordinate = x;
      } else {
        if (x - latestDrawXScaleXCoordinate <= xScaleInterval) {
          continue;
        } else {
          console.log(x);
          this.options.scaleOptions.x.tip && Tools.drawLine(this.scaleCtx, [[x, startY], [x, endY]]);
          const text = Tools.formatTime(datas[i].time, this.options.scaleOptions.x.format);
          scaleCtx.fillText(
            text,
            x + (Tools.calculateTextLength(text) * textSize) / 2,
            (this.options.scaleOptions.x.tip ? endY : this.scalePaddingBottom) - textSize * 1.5
          );
          latestDrawXScaleXCoordinate = x;
        }
      }
    }
    this.drawLines();
  }
  /**
   * 画主要部分线段
   */
  drawLines() {
    const { chartCtx } = this;
    const { datas } = this.options;
    const { width: lineWidth } = this.options.lineOptions;
    // const xScaleInterval =
    chartCtx.strokeStyle = this.options.colors[0];
    chartCtx.lineWidth = lineWidth;
    chartCtx.lineJoin = "miter";
    // this
    // chartCtx.lineCap = this.options.barStyle.lineCap;
    const drawLineSpaceVertically = this.height - this.scalePaddingBottom - this.scalePaddingTop;
    this.xScaleCoordinates.forEach((coord, index) => {
      const currentData = datas[index];
      const x = coord[0];
      const y = drawLineSpaceVertically * (datas[index].value / this.highestYScale) + this.scalePaddingBottom;
      if (index === 0) {
        chartCtx.moveTo(x, y);
      } else {
        chartCtx.lineTo(x, y);
      }
      // Tools.drawLine(chartCtx, [[x, startY + barWidth / 4], [x, endY - barWidth / 4]]);
      // setTimeout(() => {
      //   this.animateBar(x, startY + barWidth / 4, endY - barWidth / 4);
      // }, 200 * index);
      this.registeredPoints.push({
        position: [x, y],
        data: currentData
      });
    });
    this.chartCtx.stroke();
  }

  handleMouseMove = (e: MouseEvent) => {};
  handleTouchStart = (e: TouchEvent) => {
    this.tooltipCtx.clearRect(0, this.height, this.width, this.height);
    this.tooltipCtx.strokeStyle = this.tooltipCtx.fillStyle = this.options.toolTip.color[0];
    this.tooltipCtx.lineWidth = 2;
    this.tooltipCtx.setLineDash([15, 15]);
    this.tooltipCtx.font = `${this.options.textOptions.size * this.options.dpi * 0.9}px Arial`;

    // const offsetY = this.height - (e.touches[0].clientY - this.positions.top);
    const offsetX = e.touches[0].clientX - this.positions.left;
    console.log(offsetX);
    // 找出离点击点最近的x值
    let nearestData: RegisteredPoints;
    let latestDistance: number = Infinity;
    for (let i = 0; i < this.registeredPoints.length; i++) {
      const currentPoint = this.registeredPoints[i];
      const xDistance = Math.abs(currentPoint.position[0] - offsetX);
      // console.log(xDistance);
      if (xDistance > latestDistance) {
        break;
      }
      // console.log('wtite')
      nearestData = currentPoint;
      latestDistance = xDistance;
    }
    // draw enlarged circle
    this.tooltipCtx.beginPath();
    Tools.drawLine(this.tooltipCtx, [
      [nearestData.position[0], this.scalePaddingBottom],
      [nearestData.position[0], this.height - this.scalePaddingTop]
    ]);
    const tipWidth = Tools.calculateTextLength(String(nearestData.data.value)) * this.options.textOptions.size;
    const tipY = this.height - this.scalePaddingTop + 5;
    // this.tooltipCtx.fillStyle = "#fff";
    this.tooltipCtx.fillText(String(nearestData.data.value), nearestData.position[0] - tipWidth / 2, tipY);
    // this.tooltipCtx.arc(nearestData.position[0], nearestData.position[1], this.width / 50, 0, Math.PI * 2);
    // this.tooltipCtx.arc(nearestData.position[0], nearestData.position[1], this.width / 60, 0, Math.PI * 2);
    this.tooltipCtx.stroke();
    this.tooltipCtx.closePath();
    // this.tooltipCtx.stroke();
  };
}

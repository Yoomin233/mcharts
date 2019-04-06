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
  chartCanvasElement: HTMLCanvasElement;

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
    // console.log(settings)
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
    this.chartCanvasElement = chartCanvasElement;
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
    // if (navigator.maxTouchPoints) {
    // alert("added!");
    wrapperElement.addEventListener("touchstart", this.handleTouchStart);
    // } else {
    // wrapperElement.addEventListener("mousemove", this.handleMouseMove);
    // }

    // draw scales
    this.drawScales();
    requestAnimationFrame(() => {
      this.positions = chartCanvasElement.getBoundingClientRect();
    });
    return this;
  }
  rerender(newDatas: LineChartDataStruct[]) {
    this.options.datas = newDatas;
    this.xScaleCoordinates = [];
    this.yScaleCoordinates = [];
    this.registeredPoints = [];
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
    // 设定字体、线宽
    const textSize = this.options.textOptions.size;
    // 计算最大刻度和最大值
    if (Array.isArray(this.options.datas[0])) {
    } else {
      this.highestYScale = Tools.getNearest5BasedNumber(
        Math.max.apply(Math, (this.options.datas as LineChartDataStruct[]).map(d => d.value))
      );
    }
    this.scaleCtx.lineWidth = this.options.scaleOptions.width;
    // 总共y刻度的数量(+1)
    const yScaleCount = 5;
    this.scalePaddingLeft = scalePaddingLeft;
    this.scalePaddingTop = textOptions.size * 2;
    this.scalePaddingBottom = textOptions.size * 2;
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
          // console.log(x);
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
    // const desiredWidth = this.xScaleCoordinates[this.xScaleCoordinates.length - 1][0] - this.xScaleCoordinates[0][0];
    // this.chartCanvasElement.width = desiredWidth * this.options.dpi;
    // this.chartCanvasElement.style.left = `${(this.width - desiredWidth) / 2}px`;

    this.drawLines();
  }
  /**
   * 画主要部分线段
   */
  drawLines() {
    const { chartCtx, registeredPoints } = this;
    const { datas } = this.options;
    const { width: lineWidth } = this.options.lineOptions;
    // const xScaleInterval =
    chartCtx.strokeStyle = this.options.colors[0];
    chartCtx.lineWidth = lineWidth;
    chartCtx.lineJoin = "miter";
    // this
    // chartCtx.lineCap = this.options.barStyle.lineCap;
    const drawLineSpaceVertically = this.height - this.scalePaddingBottom - this.scalePaddingTop;
    // let lastPoint: [number, number];
    let highestYPoint = 0;
    let latestControlPoint: [number, number];
    this.xScaleCoordinates.forEach((coord, index) => {
      const currentData = datas[index];
      const x = coord[0];
      const y = drawLineSpaceVertically * (datas[index].value / this.highestYScale) + this.scalePaddingBottom;
      if (y > highestYPoint) {
        highestYPoint = y;
      }
      this.registeredPoints.push({
        position: [x, y],
        data: currentData
      });
    });
    this.registeredPoints.forEach(({ position: point }, index) => {
      if (this.options.lineOptions.bezierCurve) {
        let startPointCoords: [number, number];
        let endPointCoords: [number, number];
        if (index === 0) {
          const nextPointCoords = this.registeredPoints[index + 1].position;
          endPointCoords = [(nextPointCoords[0] + point[0]) / 2, (nextPointCoords[1] + point[1]) / 2];
          startPointCoords = [2 * point[0] - endPointCoords[0], endPointCoords[1]];

          // this.chartCtx.stroke();
          // this.chartCtx.beginPath();
          // this.chartCtx.strokeStyle = "#000";
          // this.chartCtx.arc(startPointCoords[0], startPointCoords[1], 5, 0, Math.PI * 2);
          // this.chartCtx.arc(endPointCoords[0], endPointCoords[1], 5, 0, Math.PI * 2);
          // this.chartCtx.stroke()
          // this.chartCtx.closePath();
          // console.log(point, nextPointCoords);
          // console.log(startPointCoords, endPointCoords);
        } else if (index === this.xScaleCoordinates.length - 1) {
          startPointCoords = latestControlPoint;
          endPointCoords = [2 * point[0] - startPointCoords[0], startPointCoords[1]];
        } else {
          const nextPointCoords = this.xScaleCoordinates[index + 1];
          startPointCoords = latestControlPoint;
          endPointCoords = [(nextPointCoords[0] + point[0]) / 2, nextPointCoords[1] + point[1] / 2];
        }
        this.chartCtx.moveTo(...startPointCoords);
        this.chartCtx.bezierCurveTo(point[0], point[1], point[0], point[1], ...endPointCoords);
        // console.log(startPointCoords, endPointCoords);
        latestControlPoint = endPointCoords;
        // this.chartCtx.beginPath();
        // this.chartCtx.arc(point[0], point[1], 5, 0, Math.PI * 2);
        // this.chartCtx.stroke();
        // this.chartCtx.closePath();
        // this.charC
      } else {
        if (index === 0) {
          // this.chartCtx.beginPath()
          // chartCtx.strokeStyle = 'yellow'
          chartCtx.moveTo(point[0], this.scalePaddingBottom + this.options.scaleOptions.width / 2);
          chartCtx.lineTo(point[0], point[1]);
          // chartCtx.stroke()
          // lastPoint = [point[0], y]
          // this.chartCtx.closePath()
        } else if (index === this.xScaleCoordinates.length - 1) {
          chartCtx.lineTo(point[0], point[1]);
          chartCtx.lineTo(point[0], this.scalePaddingBottom + this.options.scaleOptions.width / 2);
        } else {
          // chartCtx.strokeStyle = 'red'
          // chartCtx.moveTo(...lastPoint)
          chartCtx.lineTo(point[0], point[1]);
          // lastPoint = [x, y]
          // chartCtx.stroke()
        }
      }
    });
    // this.chartCtx.stroke();
    if (this.options.lineOptions.gradient.length) {
      // const startDrawX = this.xScaleCoordinates[0][0]
      // const endDrawX = this.xScaleCoordinates[this.xScaleCoordinates.length - 1][0]
      const { gradient: gradientOptions } = this.options.lineOptions;
      const gradient = this.chartCtx.createLinearGradient(0, highestYPoint, 0, this.scalePaddingBottom);
      gradientOptions.forEach(g => gradient.addColorStop(g[0], g[1]));
      this.chartCtx.fillStyle = gradient;
      // this.chartCtx.fillRect(startDrawX, highestYPoint, endDrawX - startDrawX, highestYPoint - this.scalePaddingBottom);
      this.chartCtx.fill();
      // 干掉左右两边的线段
      this.chartCtx.clearRect(0, this.height, this.xScaleCoordinates[0][0] + 1, this.height);
      const lastxScaleCoord = this.xScaleCoordinates.slice(-1)[0];
      this.chartCtx.clearRect(lastxScaleCoord[0] - 1, this.height, 1000, this.height);
    }

    // this.chartCtx.beginPath();
    // this.chartCtx.moveTo(200, 200);
    // this.chartCtx.bezierCurveTo(250, 500, 250, 500, 300, 200);
    this.chartCtx.stroke();
  }

  handleMouseMove = (e: MouseEvent) => {};
  handleTouchStart = (e: TouchEvent) => {
    this.tooltipCtx.clearRect(0, this.height, this.width, this.height);
    this.tooltipCtx.strokeStyle = this.tooltipCtx.fillStyle = this.options.toolTip.color[0];
    this.tooltipCtx.lineWidth = 2;
    this.tooltipCtx.setLineDash([10, 10]);
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

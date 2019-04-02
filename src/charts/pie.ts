import { PieChartOptions } from "index";
import * as Tools from "../tools";
import { defaultChartSettings, defaultBarChartSettings, defaultPieChartSettings } from "../consts";
import { TransformContextCoordinates } from "../tools";

type RegisterArcArea = {
  area: {
    start: number;
    end: number;
  };
  data: { value: number; item: string };
};

let lastEnlarged: RegisterArcArea;

export default class PieChart {
  options: PieChartOptions;
  wrapperElement: HTMLDivElement;
  scaleCtx: CanvasRenderingContext2D;
  chartCtx: CanvasRenderingContext2D;

  registeredArcAreas: RegisterArcArea[] = [];

  width: number;
  height: number;

  valueSum: number;

  /**
   * merge选项, 创建元素....etc
   * @param settings CommonChartOptions
   */
  constructor(settings: PieChartOptions) {
    if (!settings.mountNode) {
      return;
    }
    // set options
    const options: PieChartOptions = Tools.mergeSettings(settings, defaultPieChartSettings);
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

    // set dimensions
    chartCanvasElement.width = scaleCanvasElement.width = options.width * options.dpi;
    chartCanvasElement.height = scaleCanvasElement.height = options.height * options.dpi;
    this.width = options.width;
    this.height = options.height;

    // append...
    this.wrapperElement.appendChild(scaleCanvasElement);
    this.wrapperElement.appendChild(chartCanvasElement);
    settings.mountNode.appendChild(this.wrapperElement);

    // set canvas context and coordinates transformer
    // 将canvas坐标系转换为极坐标
    this.scaleCtx = TransformContextCoordinates(
      scaleCanvasElement.getContext("2d"),
      x => (x + this.width / 2) * this.options.dpi,
      y => (this.height / 2 - y) * this.options.dpi,
      options.dpi
    );
    this.chartCtx = TransformContextCoordinates(
      chartCanvasElement.getContext("2d"),
      x => (x + this.width / 2) * this.options.dpi,
      y => (this.height / 2 - y) * this.options.dpi,
      options.dpi
    );
    // 改写参数值
    // options.textOptions.size *= options.dpi;
    options.lineOptions.width *= options.dpi;
    options.scaleOptions.width *= options.dpi;
    // options.barOptions.width *= options.dpi;

    // 添加鼠标事件
    chartCanvasElement.addEventListener("mousemove", this.handleMouseMove.bind(this));

    // 算出数据和
    this.valueSum = options.datas.reduce((prev, next) => prev + next.value, 0);

    this.drawChart();
    return this;
  }

  /**
   * 画图
   */
  drawChart() {
    const { datas, radius, gap } = this.options;
    const { width: lineWidth } = this.options.lineOptions;
    // this.chartCtx.strokeStyle = this.options.colors[0];
    this.chartCtx.lineWidth = lineWidth;
    // const startCorrection = Math.PI * -0.5;
    datas.reduce((prev, current, index) => {
      const startAngle = (prev / this.valueSum) * Math.PI * 2 + gap / 2;
      const endAngle = ((prev + current.value) / this.valueSum) * Math.PI * 2 - gap / 2;
      // const start =
      this.chartCtx.beginPath();
      this.chartCtx.fillStyle = this.options.colors[index % this.options.colors.length];
      this.chartCtx.arc(0, 0, radius.outer, startAngle, endAngle);
      // this.chartCtx.fill();
      this.chartCtx.arc(0, 0, radius.inner, endAngle, startAngle, true);
      this.chartCtx.fill();
      this.chartCtx.closePath();
      this.registeredArcAreas.push({
        area: {
          start: startAngle,
          end: endAngle
        },
        data: current
      });
      return prev + current.value;
    }, 0);
    this.options.legends && this.drawLabels();
  }
  drawLabels = () => {
    const labelCountInEachSection = [0, 0, 0, 0];
    this.registeredArcAreas.forEach(area => {
      let sectionNumber = Math.floor((area.area.start + area.area.end) / 2 / (Math.PI / 2));
      labelCountInEachSection[sectionNumber]++;
    });
    // console.log(labelCountInEachSection)
    const drawFontSize = this.options.textOptions.size * this.options.dpi;
    this.chartCtx.font = `${drawFontSize}px Arial`;

    let currentLabelIndex = 0;
    // const drawLabelInterval =
    labelCountInEachSection.forEach((count, section) => {
      Array.from({ length: count }).forEach((_, sectionIndex) => {
        let currentArea = this.registeredArcAreas[currentLabelIndex];
        this.chartCtx.strokeStyle = this.chartCtx.fillStyle = this.options.colors[currentLabelIndex % this.options.colors.length];
        let drawX, drawY;
        switch (section) {
          case 0: {
            // drawX = this.width / 2;
            drawY = this.height / 2 - this.options.textOptions.size - this.options.textOptions.size * sectionIndex * 1.5;
            break;
          }
          case 1: {
            // drawX = this.width / 2;
            drawY = -this.options.textOptions.size - this.options.textOptions.size * sectionIndex * 1.5;
            break;
          }
          case 2: {
            console.log(section, sectionIndex);
            drawY = -this.height / 2 + this.options.textOptions.size + this.options.textOptions.size * sectionIndex * 1.5;
            break;
          }
          case 3: {
            drawY = -this.options.textOptions.size + this.options.textOptions.size * sectionIndex * 1.5;
            break;
          }
        }
        this.chartCtx.textAlign = section <= 1 ? "right" : "left";
        drawX = section <= 1 ? this.width / 2 : (this.width / 2) * -1;
        this.chartCtx.fillText(currentArea.data.item, drawX, drawY);
        // 画指示线
        const drawLineStart: [number, number] = [
          drawX + (Tools.calculateTextLength(currentArea.data.item) * this.options.textOptions.size + 5) * (section <= 1 ? -1 : 1),
          drawY
        ];
        const drawLineEnd = Tools.calculateDonutCenterPointPosition(
          currentArea.area.start,
          currentArea.area.end,
          this.options.radius.outer
        );
        Tools.drawLine(this.chartCtx, [drawLineStart, drawLineEnd]);
        currentLabelIndex++;
      });
    });
  };
  handleMouseMove = (e: MouseEvent) => {
    const offsetY = this.height / 2 - e.offsetY;
    const offsetX = e.offsetX - this.width / 2;
    const { options } = this;
    // console.log(offsetX, offsetY);

    for (let i = 0; i < this.registeredArcAreas.length; i++) {
      const currentArc = this.registeredArcAreas[i];
      // 这里的判断算法好像还有点误差?
      if (Tools.ifPointInArc(offsetX, offsetY, [options.radius.inner, options.radius.outer, currentArc.area.start, currentArc.area.end])) {
        // console.log(currentArc)
        if (lastEnlarged !== currentArc) {
          lastEnlarged = currentArc;
          this.clearEnlargedPie();
        }
        return this.drawEnlargedPie(this.registeredArcAreas[i], i);
      }
    }
    return this.clearEnlargedPie();
  };
  drawEnlargedPie = (data: RegisterArcArea, idx: number) => {
    console.log("enlarge!");
    // Tools.drawLine(this.scaleCtx, [[0, 0], [500, 500]]);
    const { radius } = this.options;
    this.scaleCtx.beginPath();
    this.scaleCtx.fillStyle = this.options.colors[idx % this.options.colors.length];

    this.scaleCtx.arc(0, 0, radius.outer + 10, data.area.start, data.area.end);
    this.scaleCtx.arc(0, 0, radius.inner - 10, data.area.end, data.area.start, true);
    this.scaleCtx.fill();
    this.scaleCtx.closePath();
  };
  clearEnlargedPie = () => {
    console.log("clear!");
    this.scaleCtx.clearRect(-this.width, this.height, 2000, 2000);
  };
}

import { start } from "repl";

/**
 * merge
 * @param supplied
 * @param appended
 */
export const mergeSettings = (supplied: object, appended: object): any => {
  for (let i in appended) {
    const currentAppended = appended[i];
    const currentSupplied = supplied[i];
    if (supplied[i]) {
      // if (typeof currentSupplied === "object" && !Array.isArray(currentSupplied) && !(supplied[i] instanceof HTMLElement)) {
      if (currentSupplied.constructor === Object) {
        supplied[i] = mergeSettings(supplied[i], currentAppended);
      }
    } else if (supplied[i] === undefined) {
      if (currentAppended instanceof Array) {
        supplied[i] = currentAppended.slice();
      } else if (currentAppended.constructor === Object) {
        supplied[i] = mergeSettings({}, appended[i]);
      } else {
        supplied[i] = currentAppended;
      }
    }
  }
  return supplied;
};

export const formatTime = (time: number, format: string): string => {
  const date = new Date(time);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate() + 1}`.padStart(2, "0");
  return format.replace("MM", month).replace("DD", day);
};

/**
 * 将canvas context的相应方法改写为想要的坐标数字
 * @param ctx canvas context
 * @param xTransformer
 * @param yTransformer
 */
export const TransformContextCoordinates = (
  ctx: CanvasRenderingContext2D,
  xTransformer: (x: number) => number,
  yTransformer: (y: number) => number,
  dpi = 2
): CanvasRenderingContext2D => {
  const originalMoveTo = ctx.moveTo.bind(ctx);
  ctx.moveTo = (x: number, y: number): void => {
    return originalMoveTo(xTransformer(x), yTransformer(y));
  };
  const originalLineTo = ctx.lineTo.bind(ctx);
  ctx.lineTo = (x: number, y: number): void => {
    return originalLineTo(xTransformer(x), yTransformer(y));
  };
  const originalFillText = ctx.fillText.bind(ctx);
  ctx.fillText = (text: string, x: number, y: number, maxWidth?: number): void => {
    return originalFillText(text, xTransformer(x), yTransformer(y), maxWidth);
  };

  const originalArc = ctx.arc.bind(ctx);
  ctx.arc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) =>
    originalArc(xTransformer(x), yTransformer(y), radius * dpi, startAngle - Math.PI / 2, endAngle - Math.PI / 2, anticlockwise);

  const originalRect = ctx.rect.bind(ctx);
  ctx.rect = (x: number, y: number, w: number, h: number) => originalRect(xTransformer(x), yTransformer(y), w * dpi, h * dpi);

  const originalFillRect = ctx.fillRect.bind(ctx);
  ctx.fillRect = (x: number, y: number, w: number, h: number) => {
    // console.log(xTransformer(x), yTransformer(y), w, h);
    return originalFillRect(xTransformer(x), yTransformer(y), w * dpi, h * dpi);
  };

  const originalClearRect = ctx.clearRect.bind(ctx);
  ctx.clearRect = (x: number, y: number, w: number, h: number) => originalClearRect(xTransformer(x), yTransformer(y), w * dpi, h * dpi);

  const originalcreateLinearGradient = ctx.createLinearGradient.bind(ctx);
  ctx.createLinearGradient = (x0: number, y0: number, x1: number, y1: number) =>
    originalcreateLinearGradient(xTransformer(x0), yTransformer(y0), xTransformer(x1), yTransformer(y1));

  const originalBezierCurveTo = ctx.bezierCurveTo.bind(ctx);
  ctx.bezierCurveTo = (cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) =>
    originalBezierCurveTo(xTransformer(cp1x), yTransformer(cp1y), xTransformer(cp2x), yTransformer(cp2y), xTransformer(x), yTransformer(y));

  return ctx;
};

/**
 * 得到最近的5整除的数字
 */
export const getNearest5BasedNumber = (num: number) => (num % 5 ? num + 5 - (num % 5) : num + 5);

/**
 * 得到变亮/变暗的色值
 * @param color
 */
export const getDifferentBrightness = (color: number | string, adjust: number): string => {
  let processed: number;
  if (typeof color === "string") {
    processed = parseInt(color.slice(1));
  } else {
    processed = color;
  }
  // if (typeof color === 'number') {
  return `#${processed * (1 + adjust)}`;
  // }
};

/**
 * 计算文字长度, 返回number
 * @param text 要计算的文字
 */
export const calculateTextLength = (text: String): number => {
  let res = 0;
  Array.prototype.forEach.call(text, (str: string) => {
    if (str.charCodeAt(0) < 128) {
      return (res += 0.5);
    }
    return (res += 1);
  });
  return res;
};

/**
 * 决定某个点是否在指定的矩形区域内
 * @param x eventposX
 * @param y eventPosY
 * @param area 区域坐标
 */
export const ifPointInArea = (x: number, y: number, area: number[][]) => {
  return x >= area[0][0] && x <= area[1][0] && y >= area[0][1] && y <= area[1][1];
};

/**
 * 决定某个点是否在饼图区域内
 * @param x
 * @param y
 * @param arc
 */
export const ifPointInArc = (x: number, y: number, arc: [number, number, number, number]) => {
  // 计算点到中心的距离
  const distanceToCenter = Math.sqrt(x ** 2 + y ** 2);
  const [innerRadius, outerRadius, startAngle, endAngle] = arc;
  // 计算点是否在某个弧度内
  const x1 = 0,
    y1 = 1;
  // 向量重整为1
  const [x2, y2] = normalizeVector([x, y]);
  const dotProduct = x1 * x2 + y1 * y2;
  let currentAngle = Math.acos(dotProduct);
  // console.log(currentAngle)
  // x <0 要做角度的特殊处理
  if (x < 0) {
    currentAngle = Math.PI * 2 - currentAngle;
  }

  if (innerRadius <= distanceToCenter && distanceToCenter <= outerRadius && currentAngle >= startAngle && currentAngle <= endAngle) {
    return true;
  }
  return false;
};

/**
 * 计算弧度中间的坐标
 * @param startAngle
 * @param endAngle
 * @param outerRadius
 * @param innerRadius
 */
export const calculateDonutCenterPointPosition = (
  startAngle: number,
  endAngle: number,
  outerRadius: number,
  innerRadius?: number
): [number, number] => {
  const x = outerRadius * Math.sin((endAngle + startAngle) / 2);
  const y = outerRadius * Math.cos((endAngle + startAngle) / 2);
  return [x, y];
};

/**
 * normalize vector
 * @param x
 * @param y
 */
const normalizeVector = (v: [number, number]): [number, number] => {
  const [x, y] = v;
  const length = Math.sqrt(x ** 2 + y ** 2);
  return [x / length, y / length];
};

/**
 * 在context上面画线
 * @param ctx canvas context
 * @param coordinates 起始点和终点的坐标
 * @param dash 可选, line dash
 */
export const drawLine = (ctx: CanvasRenderingContext2D, coordinates: [[number, number], [number, number]], dash?: number[]): void => {
  ctx.beginPath();
  if (dash) {
    ctx.setLineDash(dash);
  }
  ctx.moveTo(coordinates[0][0], coordinates[0][1]);
  ctx.lineTo(coordinates[1][0], coordinates[1][1]);
  ctx.stroke();
  ctx.closePath();
};

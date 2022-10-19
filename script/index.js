const canvas = document.getElementById("canvas");
const container = document.querySelector(".container");
const ctx = canvas.getContext("2d");
const PI = Math.PI;
const resetBtn = document.getElementById("resetBtn");
const rotateCanvasBtn = document.getElementById("rotateCanvasBtn");
/**
 * Performs the even-odd-rule Algorithm (a raycasting algorithm) to find out whether a point is in a given polygon.
 * This runs in O(n) where n is the number of edges of the polygon.
 *
 * @param {Array} polygon an array representation of the polygon where polygon[i][0] is the x Value of the i-th point and polygon[i][1] is the y Value.
 * @param {Array} point   an array representation of the point where point[0] is its x Value and point[1] is its y Value
 * @return {boolean} whether the point is in the polygon (not on the edge, just turn < into <= and > into >= for that)
 */
const pointInPolygon = function (polygon, point) {
  //A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
  let odd = false;
  //For each edge (In this case for each point of the polygon and the previous one)
  for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
    //If a line from the point into infinity crosses this edge
    if (
      polygon[i][1] > point[1] !== polygon[j][1] > point[1] && // One point needs to be above, one below our y coordinate
      // ...and the edge doesn't cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
      point[0] <
        ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1])) /
          (polygon[j][1] - polygon[i][1]) +
          polygon[i][0]
    ) {
      odd = !odd;
    }
    j = i;
  }
  //If the number of crossings was odd, the point is in the polygon
  return odd;
};

const translateM = (px, py) => [1, 0, px, 0, 1, py, 0, 0, 1];
const scaleM = (sx, sy) => [sx, 0, 0, 0, sy, 0, 0, 0, 1];
const rotate = (deg) => [
  Math.cos(deg),
  -Math.sin(deg),
  0,
  Math.sin(deg),
  Math.cos(deg),
  0,
  0,
  0,
  1,
];
const cords = (x, y) => [x, 0, 0, 0, y, 0, 0, 0, 1];
const multiply = (mt1, mt2) => {
  let m11 = mt1[0] * mt2[0] + mt1[1] * mt2[3] + mt1[2] * mt2[6];
  let m12 = mt1[0] * mt2[1] + mt1[1] * mt2[4] + mt1[2] * mt2[7];
  let m13 = mt1[0] * mt2[2] + mt1[1] * mt2[5] + mt1[2] * mt2[8];
  let m21 = mt1[3] * mt2[0] + mt1[4] * mt2[3] + mt1[5] * mt2[6];
  let m22 = mt1[3] * mt2[1] + mt1[4] * mt2[4] + mt1[5] * mt2[7];
  let m23 = mt1[3] * mt2[2] + mt1[4] * mt2[5] + mt1[5] * mt2[8];
  // let m31 = mt1[6] * mt2[0] + mt1[7] * mt2[3] + mt1[8] * mt2[6];
  // let m32 = mt1[6] * mt2[1] + mt1[7] * mt2[4] + mt1[8] * mt2[7];
  // let m33 = mt1[6] * mt2[2] + mt1[7] * mt2[5] + mt1[8] * mt2[8];
  // m31, m32, m33
  return [m11, m12, m13, m21, m22, m23];
};
const trasformedPoint = (dx, dy) => (x, y, degree) => {
  const [rx, ry] = getPoint(multiply(translateM(dx, dy), scaleM(1, 1)), x, y);
  return getPoint(rotate((PI * degree) / 180), rx, ry);
};
const getCord = (m) => {
  return [m[0] + m[2], m[4] + m[5]];
};
const getPoint = (m, x, y) => {
  return [m[0] * x + m[1] * y + m[2] * 1, m[3] * x + m[4] * y + m[5] * 1];
};
const getCode3X1 = (m) => {
  return [m[0], m[3]];
};

class Layer {
  constructor(editor) {
    this.editor = editor;
  }
  add(x, y, graphic) {
    this.x = x;
    this.y = y;
    this.graphic = graphic;
  }
  setXY(x, y) {
    this.x = x;
    this.y = y;
  }
  setGraphic(graphic) {
    this.graphic = graphic;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    this.graphic(ctx);
    ctx.restore();
  }
}

class Editor {
  constructor(ctx, canvas, container) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.container = container;
    this.devs = [];
    this.graphicDefault = [];
    this.graphics = [];
    this.tmp = null;
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
    this.animate.call(this);
  }
  resize() {
    this.width = container.clientWidth;
    this.height = container.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  reset() {
    this.resetGraphic();
    this.resetGraphicDefault();
    this.resetGraphicDev();
    this.resetGraphicTmp();
  }
  layer(x, y, graphic) {
    const layer = new Layer(this);
    layer.add(x, y, graphic);
    return layer;
  }
  addGraphic(layer) {
    this.graphics.push(layer);
  }
  addGraphicDefault(layer) {
    this.graphicDefault.push(layer);
  }
  addGraphicDev(layer) {
    this.devs.push(layer);
  }
  addGraphicTmp(layer) {
    this.tmp = layer;
  }
  resetGraphic() {
    this.graphics = [];
  }
  resetGraphicDefault() {
    this.graphicDefault = [];
  }
  resetGraphicDev() {
    this.devs = [];
  }
  resetGraphicTmp() {
    this.tmp = null;
  }
  drawDevGrid(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.fillStyle = "blue";
    ctx.arc(0, 0, 3, PI * 2, 0);
    ctx.fill();
    ctx.closePath();
  }
  animate(timeStamp = 0) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.graphicDefault.forEach((graphic) => {
      graphic.draw(this.ctx);
    });
    this.graphics.forEach((graphic) => {
      graphic.draw(this.ctx);
    });
    this.tmp && this.tmp.draw(this.ctx);
    this.devs.forEach((graphic) => {
      graphic.draw(this.ctx);
    });

    window.requestAnimationFrame(this.animate.bind(this));
  }
}
class Point {
  constructor(x, y, index) {
    this.index = index;
    this.path = new Path2D();
    this.x = x;
    this.y = y;
  }
  update(x, y) {
    this.x = x;
    this.y = y;
  }
  draw(ctx) {
    this.path.moveTo(this.x, this.y);
    this.path.arc(this.x, this.y, 8, PI * 2, 0);
    this.path.closePath();
    ctx.fill(this.path);
  }
}

class Shape {
  constructor(path = []) {
    this.centroid = [];
    this.shader = [];
    this.xCoords = [];
    this.yCoords = [];
    this.w = 0;
    this.h = 0;
    this.setPath(path);
    this.shaderCentroid = [];
    this.shaderPoints = [];
  }
  setPath(path) {
    this.path = path;
    this.segments = this.path.reduce((total, curr, index, array) => {
      const item =
        index === array.length - 1
          ? [curr, array[0]]
          : [curr, array[index + 1]];
      total.push(item);
      return total;
    }, []);
    this.xCoords = this.path.map((p) => p[0]);
    this.yCoords = this.path.map((p) => p[1]);
    this.setWidth();
    this.setHeight();
    this.centroid = this.getCentroid(this.xCoords, this.yCoords);
    this.setShader();
    this.shaderPoints = [];
    for (let i = 0; i < this.path.length; i++) {
      const [x, y] = this.path[i];
      this.shaderPoints.push(new Point(x, y, i));
    }
  }
  setWidth() {
    this.w = this.xCoords.length
      ? Math.abs(
          Math.max.apply(this, this.xCoords) -
            Math.min.apply(this, this.xCoords)
        )
      : 0;
  }
  setHeight() {
    this.h = this.yCoords.length
      ? Math.abs(
          Math.max.apply(this, this.yCoords) -
            Math.min.apply(this, this.yCoords)
        )
      : 0;
  }
  setShader() {
    this.shader = this.path.map(([x, y]) => [x * 1.2, y * 1.2]);
    let xCoords = this.shader.map((p) => p[0]);
    let yCoords = this.shader.map((p) => p[1]);
    this.shaderCentroid = this.getCentroid(xCoords, yCoords);
  }
  getCentroid(xCoords, yCoords) {
    let k = xCoords.length;
    let xCoordSum = xCoords.reduce((num, curr) => (num += curr), 0);
    let yCoordSum = yCoords.reduce((num, curr) => (num += curr), 0);
    return [xCoordSum / k, yCoordSum / k];
  }
  drawPath(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = "yellow";
    ctx.moveTo(this.path[0][0], this.path[0][1]);
    for (let i = 1; i < this.path.length; i++) {
      const [x, y] = this.path[i];
      ctx.lineTo(x, y);
      ctx.moveTo(x, y);
    }
    ctx.lineTo(this.path[0][0], this.path[0][1]);
    ctx.stroke();
  }
  drawShaderPoints(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "pink";
    for (let i = 0; i < this.shaderPoints.length; i++) {
      this.shaderPoints[i].draw(ctx);
    }
    ctx.moveTo(this.centroid[0], this.centroid[1]);
    ctx.arc(this.centroid[0], this.centroid[1], 5, PI * 2, 0);
    ctx.fill();
  }
  draw(ctx) {
    if (!this.path.length) return;
    this.drawPath(ctx);

    this.drawShaderPoints(ctx);
    // shader
    ctx.save();
    ctx.beginPath();
    const [cx, cy] = this.shaderCentroid.length
      ? [
          this.shaderCentroid[0] - this.centroid[0],
          this.shaderCentroid[1] - this.centroid[1],
        ]
      : [0, 0];

    ctx.translate(-cx, -cy);
    ctx.strokeStyle = "red";
    ctx.moveTo(this.shader[0][0], this.shader[0][1]);
    for (let i = 1; i < this.shader.length; i++) {
      const [x, y] = this.shader[i];
      ctx.lineTo(x, y);
      ctx.moveTo(x, y);
    }
    ctx.lineTo(this.shader[0][0], this.shader[0][1]);
    ctx.stroke();
    ctx.beginPath();

    ctx.fillStyle = "red";
    ctx.moveTo(this.shaderCentroid[0], this.shaderCentroid[1]);
    ctx.arc(this.shaderCentroid[0], this.shaderCentroid[1], 5, PI * 2, 0);
    ctx.fill();

    ctx.closePath();
    ctx.restore();
  }
}

function getPointerCoord(e, canvas) {
  let x = e.clientX - canvas.offsetLeft;
  let y = e.clientY - canvas.offsetTop;
  return [x, y];
}
function drawEvent(editor) {
  let startPoint = [0, 0];
  let isStart = false;
  const down = (e) => {
    if (editor.tmp || isStart) return;
    isStart = true;
    let [x, y] = getPointerCoord(e, editor.canvas);
    startPoint = [x, y];
    editor.addGraphicTmp(new Shape());
  };
  const move = (e) => {
    if (!isStart) return;
    let [x, y] = getPointerCoord(e, editor.canvas);
    editor.tmp.setPath([
      startPoint,
      [x, startPoint[1]],
      [x, y],
      [startPoint[0], y],
    ]);
  };
  const up = (e) => {
    if (!isStart) return;
    const w = editor.tmp.w;
    const h = editor.tmp.h;
    const area = Math.sqrt(w ** 2 + h ** 2);
    if (w < 10 || h < 10 || area < 50) {
      editor.tmp = null;
    }
    isStart = false;
    startPoint = [0, 0];
  };

  window.document.addEventListener("keyup", function (e) {
    if (e.key.toLocaleLowerCase() === "enter") {
      editor.addGraphic(editor.tmp);
      editor.resetGraphicTmp();
    }
  });

  return {
    down,
    move,
    up,
  };
}
function modifyEvent(editor) {
  let isStart = false;
  let target = null;
  const down = (e) => {
    if (!isStart && !target && editor.tmp) {
      let [x, y] = getPointerCoord(e, editor.canvas);
      const s = editor.tmp.shaderPoints;
      for (let i = 0; i < s.length; i++) {
        if (editor.ctx.isPointInPath(s[i].path, x, y)) {
          startPoints = {
            x,
            y,
          };
          target = s[i];
          isStart = true;
          break;
        }
      }
    }
  };

  const move = (e) => {
    if (isStart && target && editor.tmp) {
      let [x, y] = getPointerCoord(e, editor.canvas);
      const tPoints = editor.tmp.path.slice();
      const tPoint = tPoints[target.index];
      tPoint[0] = x;
      tPoint[1] = y;
      editor.tmp.setPath(editor.tmp.path);
    }
  };
  const up = (e) => {
    target = null;
    isStart = false;
  };

  editor.canvas.addEventListener("mousedown", down);
  editor.canvas.addEventListener("mousemove", move);
  editor.canvas.addEventListener("mouseup", up);
}

function main() {
  editor.addGraphicDev(
    editor.layer(editor.width / 2, editor.height / 2, editor.drawDevGrid)
  );
  editor.addGraphicDefault(
    editor.layer(50, 50, (ctx) => {
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.rect(0, 0, 100, 60);
      ctx.fill();
      ctx.closePath();
    })
  );
  const drawEventHandler = drawEvent(editor);
  editor.canvas.addEventListener("mousedown", drawEventHandler.down);
  editor.canvas.addEventListener("mousemove", drawEventHandler.move);
  editor.canvas.addEventListener("mouseleave", drawEventHandler.up);
  editor.canvas.addEventListener("mouseup", drawEventHandler.up);

  resetBtn.addEventListener("click", function () {
    editor.resetGraphicTmp();
    console.log("click");
  });
  modifyEvent(editor);
}
let editor = new Editor(ctx, canvas, container);

main();

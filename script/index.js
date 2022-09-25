const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const config = {
  cSize: 1000,
  degree: 0,
};
const PI = Math.PI;

const rotateBtn = document.getElementById("rotateBtn");
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
const ShapeRect = (function () {
  function ShapeRect(x, y, degree, scale, path = []) {
    this.x = x;
    this.y = y;

    this.degree = degree;
    this.scale = scale;
    this.hover = false;
    const xCoords = path.map(([x]) => x);
    const yCoords = path.map(([y]) => y);
    this.w = Math.max.apply(null, xCoords) - Math.min.apply(null, xCoords);
    this.h = Math.max.apply(null, yCoords) - Math.min.apply(null, yCoords);
    this.transform = trasformedPoint(-this.w / 2, -this.h / 2);
    this.path = path;
    this.coordinates = this.getPath(this.path);
    this.realCoordinate = this.coordinates.map(([x, y]) =>
      getPoint(translateM(this.x, this.y), x, y)
    );
    this.shape = new Path2D();
  }
  ShapeRect.prototype.getPath = function (path) {
    return path.map(([x, y]) => this.transform(x, y, this.degree));
  };
  ShapeRect.prototype.setDegree = function (degree) {
    this.degree = degree;
  };
  ShapeRect.prototype.update = function () {
    this.coordinates = this.getPath(this.path);
    this.realCoordinate = this.coordinates.map(([x, y]) =>
      getPoint(translateM(this.x, this.y), x, y)
    );
  };
  ShapeRect.prototype.define = function (ctx) {
    this.shape = new Path2D();
    ctx.beginPath();
    this.coordinates.forEach(([x, y], i) => {
      // ctx.beginPath();
      this.shape.moveTo(x, y);
      if (this.coordinates[i + 1]) {
        this.shape.lineTo(
          this.coordinates[i + 1][0],
          this.coordinates[i + 1][1]
        );
      } else {
        this.shape.lineTo(this.coordinates[0][0], this.coordinates[0][1]);
      }
    });
    ctx.stroke(this.shape);
  };
  ShapeRect.prototype.setXY = function (x, y) {};
  ShapeRect.prototype.draw = function (ctx) {
    this.update();
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.moveTo(-this.w / 2, -this.h / 2);
    const r = trasformedPoint(-this.w / 2, -this.h / 2)(
      0,
      -this.h,
      this.degree
    );
    ctx.lineTo(r[0], r[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r[0], r[1], 4, PI * 2, 0);
    ctx.fill();
    this.define(ctx);
    ctx.restore();
  };
  return ShapeRect;
})();

const rects = [];

const randomRange = (max, isf = true) => {
  if (isf) return max;
  const n = Math.random() * max;
  return Math.random() > 0.5 ? n : -n;
};
Array(1)
  .fill(null)
  .forEach(() => {
    rects.push(
      new ShapeRect(
        randomRange(config.cSize / 2 / 2),
        randomRange(config.cSize / 2 / 2),
        45,
        1,
        [
          [0, 0],
          [randomRange(50), 0],
          [randomRange(50), randomRange(50)],
          [0, randomRange(50)],
        ]
      )
    );
  });

function grid() {
  ctx.beginPath();
  ctx.moveTo(0, -config.cSize / 2);
  ctx.lineTo(0, config.cSize / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-config.cSize / 2, 0);
  ctx.lineTo(config.cSize / 2, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = "red";
  ctx.arc(0, 0, 5, PI * 2, 0);
  ctx.fill();
}
function draw() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  //
  ctx.save();
  ctx.translate(config.cSize / 2, config.cSize / 2);
  grid();
  ctx.rotate(config.degree);
  rects.forEach((rect) => {
    rect.draw(ctx);
  });
  ctx.restore();
}
function detectShape(e) {
  const point = [e.offsetX - canvas.width / 2, e.offsetY - canvas.height / 2];
  let target = null;
  for (let i = 0; i < rects.length; i++) {
    console.log(rects[i].realCoordinate);
    const isIn = pointInPolygon(rects[i].realCoordinate, point);
    if (isIn) {
      target = rects[i];
      break;
    }
  }
  if (target) {
    console.log(target);
  }
  return target;
}
function main() {
  draw();
  rotateCanvasBtn.addEventListener("click", function (e) {
    config.degree += 20;
    // stage angle 계산 필요
    // for (let i = 0; i < rects.length; i++) {
    //   rects[i].setDegree(rects[i].degree + config.degree);
    // }
    draw();
  });
  rotateBtn.addEventListener("click", function () {
    draw();
  });
  canvas.addEventListener("click", detectShape);
}

canvas.width = canvas.height = config.cSize;
main();

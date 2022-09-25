const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const config = {
  cSize: 300,
};

const rotateBtn = document.querySelector("#rotateBtn");

canvas.width = canvas.height = config.cSize;

const PI = Math.PI;

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
  let m31 = mt1[6] * mt2[0] + mt1[7] * mt2[3] + mt1[8] * mt2[6];
  let m32 = mt1[6] * mt2[1] + mt1[7] * mt2[4] + mt1[8] * mt2[7];
  let m33 = mt1[6] * mt2[2] + mt1[7] * mt2[5] + mt1[8] * mt2[8];
  return [m11, m12, m13, m21, m22, m23, m31, m32, m33];
};
const trasformedPoint = (dx, dy) => (x, y, degree) => {
  const fst = multiply(translateM(dx, dy), scaleM(1, 1));
  const sec = multiply(fst, rotate((PI * degree) / 180));
  // const [rx, ry] = getCord(sec);
  // const result = multiply(r, [rx, ry, 1]);
  // console.log(result);
  return getPoint(sec, x, y);
};
const getCord = (m) => {
  return [m[0] + m[2], m[4] + m[5]];
};
const getPoint = (m1, x, y) => {
  const points = [x, y, 1];
  let px = m1[0] * points[0] + m1[1] * points[1] + m1[2] * points[2];
  let py = m1[3] * points[0] + m1[4] * points[1] + m1[5] * points[2];
  return [px, py];
};
const ShapeRect = (function () {
  function ShapeRect(x, y, w, h, degree, scale) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.degree = degree;
    this.scale = scale;
    this.transform = trasformedPoint(-this.w / 2, -this.h / 2);
    this.path = this.getPath();
  }
  ShapeRect.prototype.getPath = function () {
    return [
      [0, 0],
      [0 + this.w, 0],
      [0 + this.w, 0 + this.h],
      [0, 0 + this.h],
    ].map(([x, y]) => this.transform(x, y, this.degree));
  };
  ShapeRect.prototype.setDegree = function (degree) {
    this.degree = degree;
  };
  ShapeRect.prototype.setXY = function (x, y) {};
  ShapeRect.prototype.draw = function (ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const r = trasformedPoint(0, 0)(0, -this.h, this.degree);
    ctx.lineTo(r[0], r[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r[0], r[1], 4, PI * 2, 0);
    ctx.fill();
    this.path.forEach(([x, y], i) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (this.path[i + 1]) {
        ctx.lineTo(this.path[i + 1][0], this.path[i + 1][1]);
      } else {
        ctx.lineTo(this.path[0][0], this.path[0][1]);
      }
      ctx.stroke();
      ctx.save();
      const [x1, y1] = getPoint(
        multiply(scaleM(1.3, 1.3), [x, 0, 0, y, 0, 0, 1, 0, 0]),
        x,
        y
      );
      ctx.moveTo(x1, y1);
      ctx.fillStyle = "pink";
      ctx.arc(x1, y1, 4, PI * 2, 0);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  };
  return ShapeRect;
})();

const rect = new ShapeRect(100, -50, 50, 50, 45, 1);

function main() {
  draw();
  rotateBtn.addEventListener("click", function () {
    rect.setDegree(10);
    draw();
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(config.cSize / 2, config.cSize / 2);
  ctx.restore();
  rect.draw(ctx);
  ctx.beginPath();
  ctx.save();
  ctx.fillStyle = "red";
  ctx.arc(0, 0, 5, PI * 2, 0);
  ctx.fill();
}

main();

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  toarray() : [number, number] {
    return [this.x, this.y];
  }

  add(other: Vector2) : Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vector2) : Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  div(other: Vector2) : Vector2 {
    return new Vector2(this.x / other.x, this.y / other.y);
  }

  mul(other: Vector2) : Vector2 {
    return new Vector2(this.x * other.x, this.y * other.y);
  }

  len() : number {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }

  norm() : Vector2 {
    let length = this.len();
    if(length == 0) return new Vector2(0, 0);
    return new Vector2(this.x/length, this.y/length);
  }

  scale(k: number) : Vector2 {
    return new Vector2(this.x * k, this.y * k);
  }

  distanceTo(other: Vector2) : number {
    return other.sub(this).len();
  }
}

const GRID_COLS = 10;
const GRID_ROWS = 10;
const GRID_SIZE = new Vector2(GRID_COLS, GRID_ROWS);
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 800;
const EPS = 1e-3; // to push the coordinate a tiny bit if it is already snapped
let SCENE = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));

function canvasSize(ctx: CanvasRenderingContext2D) : Vector2 {
  return new Vector2(ctx.canvas.width, ctx.canvas.height);
}

function drawCircle(ctx: CanvasRenderingContext2D, p: Vector2, radius: number) {
  ctx.beginPath();
  ctx.arc(...p.toarray(), radius, 0, 2*Math.PI);
  ctx.fill();
}

function drawLine(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
  ctx.beginPath();
  ctx.moveTo(...p1.toarray());
  ctx.lineTo(...p2.toarray());
  ctx.stroke();
}

function snap(x: number, dx: number) : number {
  if(dx > 0) return Math.ceil(x + Math.sign(dx)*EPS);
  if(dx < 0) return Math.floor(x + Math.sign(dx)*EPS);
  return x;
}

function hittingCell(p1: Vector2, p2: Vector2) : Vector2 {
  const d = p2.sub(p1);
  return new Vector2(Math.floor(p2.x + Math.sign(d.x) * EPS), 
                     Math.floor(p2.y + Math.sign(d.y) * EPS));
}

function rayStep(p1: Vector2, p2: Vector2) : Vector2 {
  let p3 = p2;
  const d = p2.sub(p1);
  if(d.x !== 0) {
    const m = d.y / d.x;
    const c = p1.y - m * p1.x;

    {
      const x3 = snap(p2.x, d.x);
      const y3 = x3 * m + c;
      p3 = new Vector2(x3, y3);
    }

    if(m != 0) {
      const y3 = snap(p2.y, d.y);
      const x3 = (y3 - c) / m;
      const p3t = new Vector2(x3, y3);
      if(p2.distanceTo(p3t) < p2.distanceTo(p3)) {
        p3 = p3t;
      }
    }
  } else {
    const y3 = snap(p2.y, d.y);
    const x3 = p2.x;
    p3 = new Vector2(x3, y3);
  }
  return p3;
}

function grid(ctx: CanvasRenderingContext2D, p2: Vector2 | undefined) {
  ctx.reset();
  ctx.fillStyle = "#181818";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  for(let y = 0; y < GRID_ROWS; ++y) {
    for(let x = 0; x < GRID_COLS; ++x) {
      if(SCENE[y][x] !== 0) {
        ctx.fillStyle = "#303030";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  ctx.lineWidth = 0.05;
  ctx.strokeStyle = "#303030";
  ctx.scale(ctx.canvas.width / GRID_COLS, ctx.canvas.height / GRID_ROWS);
  for(let x = 0; x <= GRID_COLS; ++x) {
    drawLine(ctx, new Vector2(x, 0), new Vector2(x, GRID_ROWS));
  }

  for(let y = 0; y <= GRID_ROWS; ++y) {
    drawLine(ctx, new Vector2(0, y), new Vector2(GRID_COLS, y));
  }
 
  let p1 = new Vector2(GRID_COLS * 0.37, GRID_ROWS * 0.45);
  ctx.fillStyle = "magenta";
  drawCircle(ctx, p1, 0.1);

  if(p2 !== undefined) {
    for(;;) {
      drawCircle(ctx, p2, 0.1);
      ctx.strokeStyle = "magenta";
      ctx.lineWidth = 0.01;
      drawLine(ctx, p1, p2);

      const c = hittingCell(p1, p2);
      if(c.x < 0 || c.x >= GRID_SIZE.x ||
         c.y < 0 || c.y >= GRID_SIZE.y) {
        break;
      }

      const p3 = rayStep(p1, p2);
      p1 = p2;
      p2 = p3;
    }
  }
}

(() => {
  SCENE[1][1] = 0;
  const canvas = document.getElementById("game") as (HTMLCanvasElement  | null);
  if(canvas === null) {
    throw new Error("No canvas with id `game` found");
  }

  canvas.height = SCREEN_HEIGHT;
  canvas.width = SCREEN_WIDTH;

  
  const ctx = canvas.getContext("2d");
  if(ctx === null) {
    throw new Error("2D context not supported in the browser");
  }

  let p2 : Vector2 | undefined = undefined;
  canvas.addEventListener("mousemove", (event) => {
    p2 = new Vector2(event.offsetX, event.offsetY)
        .div(canvasSize(ctx))
        .mul(GRID_SIZE);
    grid(ctx, p2);
  });

  grid(ctx, p2);
})();


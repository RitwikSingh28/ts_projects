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

  div(other: Vector2) : Vector2 {
    return new Vector2(this.x / other.x, this.y / other.y);
  }

  mul(other: Vector2) : Vector2 {
    return new Vector2(this.x * other.x, this.y * other.y);
  }
}

const GRID_COLS = 10;
const GRID_ROWS = 10;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 800;

function canvasSize(ctx: CanvasRenderingContext2D) : Vector2 {
  return new Vector2(ctx.canvas.width, ctx.canvas.height);
}

function gridSize() : Vector2 {
  return new Vector2(GRID_COLS, GRID_ROWS);
}

function drawCircle(ctx: CanvasRenderingContext2D, p: Vector2) {
  ctx.beginPath();
  ctx.arc(...p.toarray(), 0.1, 0, 2*Math.PI);
  ctx.fill();
}

function drawLine(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
  ctx.beginPath();
  ctx.moveTo(...p1.toarray());
  ctx.lineTo(...p2.toarray());
  ctx.stroke();
}

function rayStep(p1: Vector2, p2: Vector2) : Vector2 {
  return p2;
}

function grid(ctx: CanvasRenderingContext2D, p2: Vector2 | undefined) {
  ctx.reset();
  ctx.fillStyle = "#181818";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = "#303030";
  
  ctx.lineWidth = 0.05;
  ctx.scale(ctx.canvas.width / GRID_COLS, ctx.canvas.height / GRID_ROWS);
  for(let x = 0; x <= GRID_COLS; ++x) {
    drawLine(ctx, new Vector2(x, 0), new Vector2(x, GRID_ROWS));
  }

  for(let y = 0; y <= GRID_ROWS; ++y) {
    drawLine(ctx, new Vector2(0, y), new Vector2(GRID_COLS, y));
  }
 
  const p1 = new Vector2(GRID_COLS * 0.37, GRID_ROWS * 0.45);
  ctx.fillStyle = "magenta";
  drawCircle(ctx, p1);

  if(p2 !== undefined) {
    drawCircle(ctx, p2);
    ctx.strokeStyle = "magenta";
    ctx.lineWidth = 0.01;
    drawLine(ctx, p1, p2);
  }
}

(() => {
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
        .mul(gridSize());
    grid(ctx, p2);
  });

  grid(ctx, p2);
})();


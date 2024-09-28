const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 800;
const EPS = 1e-3; // to push the coordinate a tiny bit if it is already snapped
const NEAR_CLIPPING_PLANE = 0.5;
const FOV = Math.PI * 0.5;

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static zero() : Vector2 {
    return new Vector2(0, 0);
  }

  static fromAngle(angle: number) : Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle));
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
    if(length == 0) return Vector2.zero();
    return new Vector2(this.x/length, this.y/length);
  }

  scale(k: number) : Vector2 {
    return new Vector2(this.x * k, this.y * k);
  }

  distanceTo(other: Vector2) : number {
    return other.sub(this).len();
  }

  rotate90() : Vector2 {
    return new Vector2(-this.y, this.x);
  }
}


type Scene = Array<Array<number>>;

function sceneSize(scene: Scene) : Vector2 {
  const y = scene.length;
  let x = Number.MIN_VALUE;

  for (let row of scene) {
    x = Math.max(x, row.length);
  }

  console.log(`Screen size: ${x}, ${y}`);
  return new Vector2(x, y);
}

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

function minimap(ctx: CanvasRenderingContext2D, player: Player, position: Vector2, size: Vector2, scene: Scene) {
  ctx.save();
  ctx.fillStyle = "#181818";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  ctx.strokeStyle = "#303030";

  const gridSize = sceneSize(scene);

  ctx.translate(...position.toarray());
  ctx.scale(...size.div(gridSize).toarray());
  ctx.lineWidth = 0.05;

  for(let y = 0; y < gridSize.y; ++y) {
    for(let x = 0; x < gridSize.x; ++x) {
      if(scene[y][x] !== 0) {
        ctx.beginPath();
        ctx.fillStyle = "#303030";
        ctx.fillRect(x, y, 1, 1);
        ctx.fill();
      }
    }
  }

  for(let x = 0; x <= gridSize.y; ++x) {
    drawLine(ctx, new Vector2(x, 0), new Vector2(x, gridSize.x));
  }

  for(let y = 0; y <= gridSize.x; ++y) {
    drawLine(ctx, new Vector2(0, y), new Vector2(gridSize.y, y));
  }
 
  ctx.fillStyle = "magenta";
  drawCircle(ctx, player.position, 0.1);
  ctx.strokeStyle = "magenta";


  const p = player.position.add(Vector2.fromAngle(player.direction)).scale(NEAR_CLIPPING_PLANE);
  const l = Math.tan(FOV*0.5)*NEAR_CLIPPING_PLANE;
  const pl = p.add(player.position).rotate90().norm().scale(l);
  const pr = p.sub(player.position).rotate90().norm().scale(l);

  drawLine(ctx, player.position, p);
  drawLine(ctx, p, pl);
  drawLine(ctx, p, pr);

  ctx.save();
}

class Player {
  position: Vector2;
  direction: number;

  constructor(position: Vector2, direction: number) {
    this.position = position;
    this.direction = direction;
  }
}

(() => {
  let scene = [
    [0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0, 0],
    [1, 1, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 0],
  ];

  const canvas = document.getElementById("game") as (HTMLCanvasElement  | null);
  if(canvas === null) {
    throw new Error("No canvas with id `game` found");
  }

  const factor = 80;
  canvas.width = 16 * factor;
  canvas.height = 9 * factor;

  const ctx = canvas.getContext("2d");
  if(ctx === null) {
    throw new Error("2D context not supported in the browser");
  }

  let player = new Player(sceneSize(scene).mul(new Vector2(0.37, 0.52)), 0);
  let cellSize = ctx.canvas.width * 0.06;
  let minimapSize = sceneSize(scene).scale(cellSize);
  let minimapPos = Vector2.zero().add(canvasSize(ctx).scale(0.01));

  minimap(ctx, player, minimapPos, minimapSize, scene);
})();


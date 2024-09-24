"use strict";
class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static zero() {
        return new Vector2(0, 0);
    }
    toarray() {
        return [this.x, this.y];
    }
    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }
    sub(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }
    div(other) {
        return new Vector2(this.x / other.x, this.y / other.y);
    }
    mul(other) {
        return new Vector2(this.x * other.x, this.y * other.y);
    }
    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    norm() {
        let length = this.len();
        if (length == 0)
            return Vector2.zero();
        return new Vector2(this.x / length, this.y / length);
    }
    scale(k) {
        return new Vector2(this.x * k, this.y * k);
    }
    distanceTo(other) {
        return other.sub(this).len();
    }
}
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 800;
const EPS = 1e-3; // to push the coordinate a tiny bit if it is already snapped
function sceneSize(scene) {
    const y = scene.length;
    let x = Number.MIN_VALUE;
    for (let row of scene) {
        x = Math.max(x, row.length);
    }
    console.log(`Screen size: ${x}, ${y}`);
    return new Vector2(x, y);
}
function canvasSize(ctx) {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}
function drawCircle(ctx, p, radius) {
    ctx.beginPath();
    ctx.arc(...p.toarray(), radius, 0, 2 * Math.PI);
    ctx.fill();
}
function drawLine(ctx, p1, p2) {
    ctx.beginPath();
    ctx.moveTo(...p1.toarray());
    ctx.lineTo(...p2.toarray());
    ctx.stroke();
}
function snap(x, dx) {
    if (dx > 0)
        return Math.ceil(x + Math.sign(dx) * EPS);
    if (dx < 0)
        return Math.floor(x + Math.sign(dx) * EPS);
    return x;
}
function hittingCell(p1, p2) {
    const d = p2.sub(p1);
    return new Vector2(Math.floor(p2.x + Math.sign(d.x) * EPS), Math.floor(p2.y + Math.sign(d.y) * EPS));
}
function rayStep(p1, p2) {
    let p3 = p2;
    const d = p2.sub(p1);
    if (d.x !== 0) {
        const m = d.y / d.x;
        const c = p1.y - m * p1.x;
        {
            const x3 = snap(p2.x, d.x);
            const y3 = x3 * m + c;
            p3 = new Vector2(x3, y3);
        }
        if (m != 0) {
            const y3 = snap(p2.y, d.y);
            const x3 = (y3 - c) / m;
            const p3t = new Vector2(x3, y3);
            if (p2.distanceTo(p3t) < p2.distanceTo(p3)) {
                p3 = p3t;
            }
        }
    }
    else {
        const y3 = snap(p2.y, d.y);
        const x3 = p2.x;
        p3 = new Vector2(x3, y3);
    }
    return p3;
}
function minimap(ctx, p1, p2, position, size, scene) {
    ctx.reset();
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = "#303030";
    const gridSize = sceneSize(scene);
    ctx.translate(...position.toarray());
    ctx.scale(...size.div(gridSize).toarray());
    ctx.lineWidth = 0.05;
    for (let y = 0; y < gridSize.y; ++y) {
        for (let x = 0; x < gridSize.x; ++x) {
            if (scene[y][x] !== 0) {
                ctx.beginPath();
                ctx.fillStyle = "#303030";
                ctx.fillRect(x, y, 1, 1);
                ctx.fill();
            }
        }
    }
    for (let x = 0; x <= gridSize.y; ++x) {
        drawLine(ctx, new Vector2(x, 0), new Vector2(x, gridSize.x));
    }
    for (let y = 0; y <= gridSize.x; ++y) {
        drawLine(ctx, new Vector2(0, y), new Vector2(gridSize.y, y));
    }
    ctx.fillStyle = "magenta";
    drawCircle(ctx, p1, 0.1);
    if (p2 !== undefined) {
        for (;;) {
            drawCircle(ctx, p2, 0.1);
            ctx.strokeStyle = "magenta";
            ctx.lineWidth = 0.01;
            drawLine(ctx, p1, p2);
            const c = hittingCell(p1, p2);
            if (c.x < 0 || c.x >= gridSize.y ||
                c.y < 0 || c.y >= gridSize.x ||
                scene[c.y][c.x] === 1) {
                break;
            }
            const p3 = rayStep(p1, p2);
            p1 = p2;
            p2 = p3;
        }
    }
}
class Player {
    constructor(position, direction) {
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
    const canvas = document.getElementById("game");
    if (canvas === null) {
        throw new Error("No canvas with id `game` found");
    }
    const factor = 80;
    canvas.width = 16 * factor;
    canvas.height = 9 * factor;
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
        throw new Error("2D context not supported in the browser");
    }
    let p1 = sceneSize(scene).mul(new Vector2(0.37, 0.52));
    let p2 = undefined;
    let minimapPos = Vector2.zero().add(canvasSize(ctx).scale(0.01));
    let cellSize = ctx.canvas.width * 0.02;
    let minimapSize = sceneSize(scene).scale(cellSize);
    canvas.addEventListener("mousemove", (event) => {
        p2 = new Vector2(event.offsetX, event.offsetY)
            .sub(minimapPos)
            .div(minimapSize)
            .mul(sceneSize(scene));
        minimap(ctx, p1, p2, minimapPos, minimapSize, scene);
    });
    minimap(ctx, p1, p2, minimapPos, minimapSize, scene);
})();

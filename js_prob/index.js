"use strict";
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    array() {
        return [this.x, this.y];
    }
    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }
    scale(val) {
        return new Vec2(this.x * val, this.y * val);
    }
}
function playSoundEffect(audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}
function strokeLine(ctx, strokeStyle, p1, p2) {
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
}
function fillCircle(ctx, fillStyle, c, r) {
    ctx.beginPath();
    ctx.fillStyle = fillStyle;
    ctx.arc(...c.array(), r, 0, 2 * Math.PI);
    ctx.fill();
}
(() => {
    const game = document.getElementById("game");
    if (game === null) {
        throw new Error("No canvas with id `game` found");
    }
    const ctx = game.getContext("2d");
    if (ctx === null) {
        throw new Error("2D Context not supported");
    }
    let start = undefined;
    let radius = 50;
    let pos = new Vec2(radius + 1, radius + 1);
    let dpos = new Vec2(500, 500);
    // our own event loop
    const step = (timestamp) => {
        if (start === undefined) {
            start = timestamp;
        }
        const dt = (timestamp - start) / 1000;
        start = timestamp;
        pos = pos.add(dpos.scale(dt));
        game.width = window.innerWidth;
        game.height = window.innerHeight;
        const CANVAS = new Vec2(game.width, game.height);
        ctx.clearRect(0, 0, ...CANVAS.array());
        ctx.fillStyle = "#181818";
        fillCircle(ctx, "green", pos, radius);
        if (pos.x + radius > CANVAS.x || pos.x - radius < 0) {
            dpos.x = -dpos.x;
        }
        if (pos.y + radius > CANVAS.y || pos.y - radius < 0) {
            dpos.y = -dpos.y;
        }
        window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
})();

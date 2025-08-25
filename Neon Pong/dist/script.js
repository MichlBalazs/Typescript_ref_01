"use strict";
const DIFFICULTIES = {
    easy: { aiSpeed: 5, ballBaseSpeed: 4, accelPerHit: 0.25, maxBallSpeed: 8, aiJitter: 14 },
    normal: { aiSpeed: 8, ballBaseSpeed: 6, accelPerHit: 0.30, maxBallSpeed: 10, aiJitter: 9 },
    hard: { aiSpeed: 11, ballBaseSpeed: 8, accelPerHit: 0.35, maxBallSpeed: 12, aiJitter: 4 }
};

var KeyBindings;
(function (KeyBindings) {
    KeyBindings[KeyBindings["UP"] = 38] = "UP";
    KeyBindings[KeyBindings["DOWN"] = 40] = "DOWN";
    KeyBindings[KeyBindings["P"] = 80] = "P";
    KeyBindings[KeyBindings["R"] = 82] = "R";
})(KeyBindings || (KeyBindings = {}));

let game = null;

const modal = document.getElementById("difficultyModal");
const difficultyBtn = document.getElementById("difficultyBtn");
const soundBtn = document.getElementById("soundBtn");
const bgm = document.getElementById("bgm");

bgm.volume = 0.35; 
bgm.loop = true;

window.addEventListener("pointerdown", () => {
    if (bgm.paused && soundBtn.getAttribute("aria-pressed") === "true") {
        bgm.play().catch(() => { });
    }
}, { once: true });

difficultyBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    game === null || game === void 0 ? void 0 : game.setPaused(true);
});
let soundOn = true;
function updateSoundIcon() {
    soundBtn.textContent = soundOn ? "🔊" : "🔇";
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
}
updateSoundIcon();
soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    updateSoundIcon();
    if (soundOn) {
        bgm.muted = false;
        bgm.play().catch(() => { });
    }
    else {
        bgm.muted = true;
    }
});

modal.querySelectorAll("button[data-level]").forEach(btn => {
    btn.addEventListener("click", () => {
        const level = btn.getAttribute("data-level");
        modal.classList.add("hidden");
        if (!game) {
            game = new Game(DIFFICULTIES[level]);
        }
        else {
            game.applyDifficulty(DIFFICULTIES[level]);
        }
        game.setPaused(false);
        if (soundOn)
            bgm.play().catch(() => { });
    });
});

function roundRect(ctx, x, y, w, h, r = 10) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

class Entity {
    constructor(width, height, x, y) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }
    draw(ctx) { ctx.fillStyle = "#fff"; ctx.fillRect(this.x, this.y, this.width, this.height); }
}

class Paddle extends Entity {
    constructor() {
        super(...arguments);
        this.speed = 10;
    }
    update(canvas) {
        if (Game.keys[KeyBindings.UP])
            this.y = Math.max(20, this.y - this.speed);
        if (Game.keys[KeyBindings.DOWN])
            this.y = Math.min(canvas.height - 20 - this.height, this.y + this.speed);
    }
    draw(ctx) {
        ctx.save();
        const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        grad.addColorStop(0, "#00FFA3");
        grad.addColorStop(1, "#00E5FF");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(0,229,255,.75)";
        ctx.shadowBlur = 18;
        roundRect(ctx, this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        ctx.restore();
    }
}
class ComputerPaddle extends Paddle {
    constructor(w, h, x, y, speedAi, jitter) {
        super(w, h, x, y);
        this.speedAi = speedAi;
        this.jitter = jitter;
    }
    updateAi(ball, canvas) {
        const targetY = ball.y + ball.height / 2 + (Math.random() * 2 - 1) * this.jitter;
        const center = this.y + this.height / 2;
        if (ball.xVel === 1) {
            if (targetY < center - 8)
                this.y = Math.max(20, this.y - this.speedAi);
            else if (targetY > center + 8)
                this.y = Math.min(canvas.height - 20 - this.height, this.y + this.speedAi);
        }
    }
    applyDiff(d) { this.speedAi = d.aiSpeed; this.jitter = d.aiJitter; }
}

class Ball extends Entity {
    constructor(w, h, x, y, baseSpeed, accelPerHit, maxSpeed) {
        super(w, h, x, y);
        this.baseSpeed = baseSpeed;
        this.accelPerHit = accelPerHit;
        this.maxSpeed = maxSpeed;
        this.xVel = 1;
        this.yVel = 1;
        this.trail = [];
        this.speed = baseSpeed;
        this.randomizeDir();
    }
    applyDiff(d) {
        this.baseSpeed = d.ballBaseSpeed;
        this.accelPerHit = d.accelPerHit;
        this.maxSpeed = d.maxBallSpeed;
        this.speed = this.baseSpeed;
    }
    randomizeDir() {
        this.xVel = Math.random() < 0.5 ? -1 : 1;
        this.yVel = Math.random() < 0.5 ? -1 : 1;
    }
    reset(canvas) {
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height / 2 - this.height / 2;
        this.trail.length = 0;
        this.speed = this.baseSpeed;
        this.randomizeDir();
    }
    accelerate() {
        this.speed = Math.min(this.maxSpeed, this.speed + this.accelPerHit);
    }
    update(player, ai, canvas) {
        if (this.y <= 10)
            this.yVel = 1;
        if (this.y + this.height >= canvas.height - 10)
            this.yVel = -1;
        if (this.x <= 0) {
            Game.computerScore++;
            this.reset(canvas);
        }
        if (this.x + this.width >= canvas.width) {
            Game.playerScore++;
            this.reset(canvas);
        }
        if (this.x <= player.x + player.width &&
            this.y + this.height >= player.y &&
            this.y <= player.y + player.height) {
            this.xVel = 1;
            this.accelerate();
        }
        if (this.x + this.width >= ai.x &&
            this.y + this.height >= ai.y &&
            this.y <= ai.y + ai.height) {
            this.xVel = -1;
            this.accelerate();
        }
        this.x += this.xVel * this.speed;
        this.y += this.yVel * this.speed;
        this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2, alpha: 0.8 });
        if (this.trail.length > 10)
            this.trail.shift();
    }
    draw(ctx) {
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            ctx.save();
            ctx.fillStyle = `rgba(124,77,255,${t.alpha * (i + 1) / this.trail.length})`;
            ctx.shadowColor = "rgba(124,77,255,.6)";
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 10 * (i + 1) / this.trail.length, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
        ctx.save();
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 10);
        grad.addColorStop(0, "#FFFFFF");
        grad.addColorStop(1, "#7C4DFF");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(0,229,255,.8)";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Game {
    constructor(diff) {
        this.diff = diff;
        this.paused = false;
        this.canvas = document.getElementById("game-canvas");
        const c = this.canvas.getContext("2d");
        if (!c)
            throw new Error("No 2D context");
        this.ctx = c;
        this.scaleForHiDPI();
        window.addEventListener("keydown", (e) => (Game.keys[e.which] = true));
        window.addEventListener("keyup", (e) => (Game.keys[e.which] = false));
        window.addEventListener("keydown", (e) => {
            if (e.which === KeyBindings.P)
                this.setPaused(!this.paused);
            if (e.which === KeyBindings.R)
                this.reset();
        });
        const padW = 18, padH = 90, ball = 12, wall = 22;
        this.player = new Paddle(padW, padH, wall, this.canvas.height / 2 - padH / 2);
        this.ai = new ComputerPaddle(padW, padH, this.canvas.width - (wall + padW), this.canvas.height / 2 - padH / 2, diff.aiSpeed, diff.aiJitter);
        this.ball = new Ball(ball, ball, this.canvas.width / 2 - ball / 2, this.canvas.height / 2 - ball / 2, diff.ballBaseSpeed, diff.accelPerHit, diff.maxBallSpeed);
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }
    applyDifficulty(d) {
        this.diff = d;
        this.ai.applyDiff(d);
        this.ball.applyDiff(d);
    }
    setPaused(v) { this.paused = v; }
    scaleForHiDPI() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const cssW = this.canvas.clientWidth || this.canvas.width;
        const cssH = this.canvas.clientHeight || this.canvas.height;
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.font = "28px Orbitron, sans-serif";
    }
    drawCourt() {
        const g = this.ctx, w = this.canvas.width, h = this.canvas.height;
        const bg = g.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, Math.max(w, h));
        bg.addColorStop(0, "rgba(0,229,255,0.08)");
        bg.addColorStop(1, "rgba(124,77,255,0.03)");
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
        g.save();
        g.strokeStyle = "rgba(255,255,255,0.8)";
        g.shadowColor = "rgba(0,229,255,0.6)";
        g.shadowBlur = 18;
        g.lineWidth = 4;
        g.strokeRect(10, 10, w - 20, h - 20);
        g.restore();
        g.save();
        g.strokeStyle = "rgba(255,255,255,0.8)";
        g.setLineDash([18, 18]);
        g.lineWidth = 6;
        g.shadowColor = "rgba(124,77,255,0.5)";
        g.shadowBlur = 14;
        g.beginPath();
        g.moveTo(w / 2, 20);
        g.lineTo(w / 2, h - 20);
        g.stroke();
        g.restore();
        document.getElementById("pScore").textContent = String(Game.playerScore);
        document.getElementById("cScore").textContent = String(Game.computerScore);
    }
    update() {
        if (this.paused)
            return;
        this.player.update(this.canvas);
        this.ai.updateAi(this.ball, this.canvas);
        this.ball.update(this.player, this.ai, this.canvas);
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCourt();
        this.player.draw(this.ctx);
        this.ai.draw(this.ctx);
        this.ball.draw(this.ctx);
    }
    reset() {
        Game.playerScore = 0;
        Game.computerScore = 0;
        const ph = this.player.height;
        this.player.y = this.canvas.height / 2 - ph / 2;
        this.ai.y = this.player.y;
        this.ball.reset(this.canvas);
    }
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}
Game.keys = [];
Game.playerScore = 0;
Game.computerScore = 0;
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
    }
}, { passive: false });

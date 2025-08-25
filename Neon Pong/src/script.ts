
interface Difficulty {
  aiSpeed: number;       
  ballBaseSpeed: number; 
  accelPerHit: number;   
  maxBallSpeed: number; 
  aiJitter: number;     
}
const DIFFICULTIES: Record<"easy"|"normal"|"hard", Difficulty> = {
  easy:   { aiSpeed: 5,  ballBaseSpeed: 4, accelPerHit: 0.25, maxBallSpeed: 8,  aiJitter: 14 },
  normal: { aiSpeed: 8,  ballBaseSpeed: 6, accelPerHit: 0.30, maxBallSpeed: 10, aiJitter: 9  },
  hard:   { aiSpeed: 11, ballBaseSpeed: 8, accelPerHit: 0.35, maxBallSpeed: 12, aiJitter: 4  }
};

enum KeyBindings { UP = 38, DOWN = 40, P = 80, R = 82 }
type Ctx2D = CanvasRenderingContext2D;

let game: Game | null = null;

const modal = document.getElementById("difficultyModal") as HTMLDivElement;
const difficultyBtn = document.getElementById("difficultyBtn") as HTMLButtonElement;
const soundBtn = document.getElementById("soundBtn") as HTMLButtonElement;
const bgm = document.getElementById("bgm") as HTMLAudioElement;

bgm.volume = 0.35;
bgm.loop = true;


window.addEventListener("pointerdown", () => {
  if (bgm.paused && soundBtn.getAttribute("aria-pressed") === "true") {
    bgm.play().catch(()=>{});
  }
}, { once: true });


difficultyBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  game?.setPaused(true);
});

let soundOn = true;
function updateSoundIcon(){
  soundBtn.textContent = soundOn ? "🔊" : "🔇";
  soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
}
updateSoundIcon();

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  updateSoundIcon();
  if (soundOn) {
    bgm.muted = false;
    bgm.play().catch(()=>{});
  } else {
    bgm.muted = true;
  }
});


modal.querySelectorAll<HTMLButtonElement>("button[data-level]").forEach(btn => {
  btn.addEventListener("click", () => {
    const level = btn.getAttribute("data-level") as "easy"|"normal"|"hard";
    modal.classList.add("hidden");
    if (!game) {
      game = new Game(DIFFICULTIES[level]);
    } else {
      game.applyDifficulty(DIFFICULTIES[level]);
    }
    game.setPaused(false);
    if (soundOn) bgm.play().catch(()=>{});
  });
});


function roundRect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r = 10) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y,   x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x,   y+h, rr);
  ctx.arcTo(x,   y+h, x,   y,   rr);
  ctx.arcTo(x,   y,   x+w, y,   rr);
  ctx.closePath();
}

class Entity {
  constructor(public width:number, public height:number, public x:number, public y:number) {}
  draw(ctx: Ctx2D) { ctx.fillStyle = "#fff"; ctx.fillRect(this.x, this.y, this.width, this.height); }
}

class Paddle extends Entity {
  private speed = 10;
  update(canvas: HTMLCanvasElement) {
    if (Game.keys[KeyBindings.UP])   this.y = Math.max(20, this.y - this.speed);
    if (Game.keys[KeyBindings.DOWN]) this.y = Math.min(canvas.height - 20 - this.height, this.y + this.speed);
  }
  draw(ctx: Ctx2D) {
    ctx.save();
    const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    grad.addColorStop(0, "#00FFA3"); grad.addColorStop(1, "#00E5FF");
    ctx.fillStyle = grad; ctx.shadowColor = "rgba(0,229,255,.75)"; ctx.shadowBlur = 18;
    roundRect(ctx, this.x, this.y, this.width, this.height, 10); ctx.fill(); ctx.restore();
  }
}

class ComputerPaddle extends Paddle {
  constructor(w:number,h:number,x:number,y:number, private speedAi:number, private jitter:number){
    super(w,h,x,y);
  }
  updateAi(ball: Ball, canvas: HTMLCanvasElement) {
    const targetY = ball.y + ball.height/2 + (Math.random()*2-1)*this.jitter;
    const center = this.y + this.height/2;
    if (ball.xVel === 1) {
      if (targetY < center - 8) this.y = Math.max(20, this.y - this.speedAi);
      else if (targetY > center + 8) this.y = Math.min(canvas.height - 20 - this.height, this.y + this.speedAi);
    }
  }
  applyDiff(d: Difficulty){ this.speedAi = d.aiSpeed; this.jitter = d.aiJitter; }
}

class Ball extends Entity {
  private speed: number;
  public xVel = 1;
  public yVel = 1;
  private trail: {x:number;y:number;alpha:number}[] = [];

  constructor(w:number,h:number,x:number,y:number, private baseSpeed:number, private accelPerHit:number, private maxSpeed:number){
    super(w,h,x,y);
    this.speed = baseSpeed;
    this.randomizeDir();
  }

  applyDiff(d: Difficulty){
    this.baseSpeed = d.ballBaseSpeed;
    this.accelPerHit = d.accelPerHit;
    this.maxSpeed = d.maxBallSpeed;
    this.speed = this.baseSpeed;
  }

  private randomizeDir(){
    this.xVel = Math.random() < 0.5 ? -1 : 1;
    this.yVel = Math.random() < 0.5 ? -1 : 1;
  }

  reset(canvas: HTMLCanvasElement){
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height / 2 - this.height / 2;
    this.trail.length = 0;
    this.speed = this.baseSpeed;
    this.randomizeDir();
  }

  private accelerate(){
    this.speed = Math.min(this.maxSpeed, this.speed + this.accelPerHit);
  }

  update(player: Paddle, ai: ComputerPaddle, canvas: HTMLCanvasElement) {
    if (this.y <= 10) this.yVel = 1;
    if (this.y + this.height >= canvas.height - 10) this.yVel = -1;

    if (this.x <= 0) { Game.computerScore++; this.reset(canvas); }
    if (this.x + this.width >= canvas.width) { Game.playerScore++; this.reset(canvas); }

    if (this.x <= player.x + player.width &&
        this.y + this.height >= player.y &&
        this.y <= player.y + player.height) {
      this.xVel = 1; this.accelerate();
    }

    if (this.x + this.width >= (ai as any).x &&
        this.y + this.height >= (ai as any).y &&
        this.y <= (ai as any).y + (ai as any).height) {
      this.xVel = -1; this.accelerate();
    }

    this.x += this.xVel * this.speed;
    this.y += this.yVel * this.speed;

    this.trail.push({ x: this.x + this.width/2, y: this.y + this.height/2, alpha: 0.8 });
    if (this.trail.length > 10) this.trail.shift();
  }

  draw(ctx: Ctx2D) {
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      ctx.save();
      ctx.fillStyle = `rgba(124,77,255,${t.alpha * (i+1)/this.trail.length})`;
      ctx.shadowColor = "rgba(124,77,255,.6)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 10 * (i+1)/this.trail.length, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    const cx = this.x + this.width/2, cy = this.y + this.height/2;
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 10);
    grad.addColorStop(0, "#FFFFFF"); grad.addColorStop(1, "#7C4DFF");
    ctx.fillStyle = grad; ctx.shadowColor = "rgba(0,229,255,.8)"; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2); ctx.fill(); ctx.restore();
  }
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: Ctx2D;
  private paused = false;

  static keys: boolean[] = [];
  static playerScore = 0;
  static computerScore = 0;

  private player: Paddle;
  private ai: ComputerPaddle;
  private ball: Ball;

  constructor(private diff: Difficulty) {
    this.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
    const c = this.canvas.getContext("2d"); if (!c) throw new Error("No 2D context"); this.ctx = c;

    this.scaleForHiDPI();

    window.addEventListener("keydown", (e) => (Game.keys[e.which] = true));
    window.addEventListener("keyup",   (e) => (Game.keys[e.which] = false));
    window.addEventListener("keydown", (e) => {
      if (e.which === KeyBindings.P) this.setPaused(!this.paused);
      if (e.which === KeyBindings.R) this.reset();
    });

    const padW = 18, padH = 90, ball = 12, wall = 22;
    this.player = new Paddle(padW, padH, wall, this.canvas.height/2 - padH/2);
    this.ai     = new ComputerPaddle(padW, padH, this.canvas.width-(wall+padW), this.canvas.height/2 - padH/2, diff.aiSpeed, diff.aiJitter);
    this.ball   = new Ball(ball, ball, this.canvas.width/2 - ball/2, this.canvas.height/2 - ball/2, diff.ballBaseSpeed, diff.accelPerHit, diff.maxBallSpeed);

    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  applyDifficulty(d: Difficulty){
    this.diff = d;
    this.ai.applyDiff(d);
    this.ball.applyDiff(d);
  }

  setPaused(v: boolean){ this.paused = v; }

  private scaleForHiDPI(){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = this.canvas.clientWidth || this.canvas.width;
    const cssH = this.canvas.clientHeight || this.canvas.height;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.font = "28px Orbitron, sans-serif";
  }

  private drawCourt(){
    const g = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const bg = g.createRadialGradient(w/2, h/2, 60, w/2, h/2, Math.max(w,h));
    bg.addColorStop(0, "rgba(0,229,255,0.08)"); bg.addColorStop(1, "rgba(124,77,255,0.03)");
    g.fillStyle = bg; g.fillRect(0, 0, w, h);

    g.save(); g.strokeStyle = "rgba(255,255,255,0.8)"; g.shadowColor = "rgba(0,229,255,0.6)";
    g.shadowBlur = 18; g.lineWidth = 4; g.strokeRect(10,10,w-20,h-20); g.restore();

    g.save(); g.strokeStyle = "rgba(255,255,255,0.8)"; g.setLineDash([18,18]);
    g.lineWidth = 6; g.shadowColor = "rgba(124,77,255,0.5)"; g.shadowBlur = 14;
    g.beginPath(); g.moveTo(w/2, 20); g.lineTo(w/2, h-20); g.stroke(); g.restore();

    (document.getElementById("pScore") as HTMLElement).textContent = String(Game.playerScore);
    (document.getElementById("cScore") as HTMLElement).textContent = String(Game.computerScore);
  }

  update(){
    if (this.paused) return;
    this.player.update(this.canvas);
    this.ai.updateAi(this.ball, this.canvas);
    this.ball.update(this.player, this.ai, this.canvas);
  }

  draw(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.drawCourt();
    this.player.draw(this.ctx);
    this.ai.draw(this.ctx);
    this.ball.draw(this.ctx);
  }

  private reset(){
    Game.playerScore = 0; Game.computerScore = 0;
    const ph = this.player.height;
    this.player.y = this.canvas.height/2 - ph/2;
    this.ai.y = this.player.y;
    this.ball.reset(this.canvas);
  }

  private gameLoop(){
    this.update(); this.draw();
    requestAnimationFrame(this.gameLoop);
  }
}


window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
  }
}, { passive: false });

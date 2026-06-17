const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");

let running = false;
let gameOver = false;

let balls, bricks, score, paddle, powerUps;
let shield = false;
let shieldEndTime = 0;

const rows = 5;
const cols = 8;
const bw = 80;
const bh = 20;
const pad = 10;
const offX = 35;
const offY = 40;

// ===== INIT =====
function initGame() {

    balls = [{
        x: 400,
        y: 500,
        dx: 5,
        dy: -6,
        r: 10
    }];

    paddle = {
        x: 350,
        y: 570,
        w: 120,
        h: 15,
        speed: 12,
        left: false,
        right: false
    };

    score = 0;
    powerUps = [];
    shield = false;
    shieldEndTime = 0;
    gameOver = false;
}

// ===== BRICKS =====
function createBricks() {

    bricks = [];

    for (let r = 0; r < rows; r++) {
        bricks[r] = [];

        for (let c = 0; c < cols; c++) {
            bricks[r][c] = {
                x: c * (bw + pad) + offX,
                y: r * (bh + pad) + offY,
                alive: true
            };
        }
    }
}

// ===== START =====
startBtn.onclick = () => {
    menu.style.display = "none";
    gameContainer.style.display = "block";

    initGame();
    createBricks();

    if (!running) {
        running = true;
        loop();
    }
};

// ===== RESTART =====
restartBtn.onclick = () => {
    initGame();
    createBricks();

    if (!running) {
        running = true;
        loop();
    }
};

// ===== CONTROLS =====
document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") paddle.left = true;
    if (e.key === "ArrowRight") paddle.right = true;
});

document.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft") paddle.left = false;
    if (e.key === "ArrowRight") paddle.right = false;
});

// ===== POWERUPS =====
function spawnPowerUp(x, y) {
    powerUps.push({
        x,
        y,
        type: Math.random() < 0.5 ? "shield" : "multi"
    });
}

function updatePowerUps() {

    for (let i = powerUps.length - 1; i >= 0; i--) {

        let p = powerUps[i];
        p.y += 4;

        if (p.y > canvas.height + 50) {
            powerUps.splice(i, 1);
            continue;
        }

        if (
            p.y > paddle.y &&
            p.x > paddle.x &&
            p.x < paddle.x + paddle.w
        ) {

            if (p.type === "shield") {
                shield = true;
                shieldEndTime = Date.now() + 10000;
            }

            if (p.type === "multi") {
                let b = balls[0];

                balls.push(
                    { x: b.x, y: b.y, dx: -6, dy: -6, r: 10 },
                    { x: b.x, y: b.y, dx: 6, dy: -6, r: 10 }
                );
            }

            powerUps.splice(i, 1);
        }
    }
}

// ===== DRAW =====
function drawBall(b) {

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);

    if (shield) {
        ctx.shadowColor = "lime";
        ctx.shadowBlur = 25;
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    ctx.fillStyle = "white";
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    ctx.fillStyle = "cyan";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
}

function drawBricks() {

    const colors = ["red","orange","yellow","green","blue"];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {

            let b = bricks[r][c];

            if (b.alive) {
                ctx.fillStyle = colors[r];
                ctx.fillRect(b.x, b.y, bw, bh);
            }
        }
    }
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 25);
}

// ===== LOOP =====
function loop() {

    if (!running) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (shield && Date.now() > shieldEndTime) {
        shield = false;
    }

    drawBricks();
    drawPaddle();
    drawScore();

    updatePowerUps();

    if (paddle.left) paddle.x -= paddle.speed;
    if (paddle.right) paddle.x += paddle.speed;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > canvas.width)
        paddle.x = canvas.width - paddle.w;

    for (let i = balls.length - 1; i >= 0; i--) {

        let b = balls[i];

        drawBall(b);

        if (b.x < 0 || b.x > canvas.width) b.dx *= -1;
        if (b.y < 0) b.dy *= -1;

        if (
            b.y > paddle.y &&
            b.x > paddle.x &&
            b.x < paddle.x + paddle.w
        ) {
            b.dy = -Math.abs(b.dy);
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {

                let br = bricks[r][c];

                if (br.alive &&
                    b.x > br.x &&
                    b.x < br.x + bw &&
                    b.y > br.y &&
                    b.y < br.y + bh
                ) {
                    br.alive = false;
                    score++;

                    if (Math.random() < 0.3) spawnPowerUp(br.x, br.y);

                    b.dy *= -1;
                }
            }
        }

        if (b.y > canvas.height) {
            balls.splice(i, 1);
        }

        b.x += b.dx;
        b.y += b.dy;
    }

    requestAnimationFrame(loop);
}
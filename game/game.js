const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");

let running = false;
let gameOver = false;
let gameWon = false;

let balls, bricks, score, paddle, powerUps;
let shield = false;
let shieldEndTime = 0;

let storedShield = 0;
let storedMulti = 0;

const rows = 5;
const cols = 8;
const bw = 80;
const bh = 20;
const pad = 10;
const offX = 35;
const offY = 40;

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
    storedShield = 0;
    storedMulti = 0;
    gameOver = false;
    gameWon = false;
}

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

startBtn.onclick = () => {
    menu.style.display = "none";
    gameContainer.style.display = "block";

    initGame();
    createBricks();

    if (!running) {
        running = true;
        requestAnimationFrame(loop);
    }
};

restartBtn.onclick = () => {
    initGame();
    createBricks();

    gameOver = false;
    gameWon = false;
    running = true;
};

document.addEventListener("keydown", e => {
    if (!paddle) return;

    if (e.key === "ArrowLeft") paddle.left = true;
    if (e.key === "ArrowRight") paddle.right = true;

    if (e.key.toLowerCase() === "q") {
        if (storedShield > 0 && !gameOver && !gameWon) {
            storedShield--;
            activatePowerUp("shield");
        }
    }

    if (e.key.toLowerCase() === "e") {
        if (storedMulti > 0 && !gameOver && !gameWon) {
            storedMulti--;
            activatePowerUp("multi");
        }
    }
});

document.addEventListener("keyup", e => {
    if (!paddle) return;

    if (e.key === "ArrowLeft") paddle.left = false;
    if (e.key === "ArrowRight") paddle.right = false;
});

function spawnPowerUp(x, y) {
    powerUps.push({
        x: x + bw / 2,
        y: y + bh / 2,
        w: 26,
        h: 26,
        dy: 4,
        type: Math.random() < 0.5 ? "shield" : "multi"
    });
}

function activatePowerUp(type) {
    if (type === "shield") {
        shield = true;
        shieldEndTime = Date.now() + 10000;
    }

    if (type === "multi") {
        let b = balls[0];
        if (!b) return;

        balls.push(
            { x: b.x, y: b.y, dx: -6, dy: -6, r: 10 },
            { x: b.x, y: b.y, dx: 6, dy: -6, r: 10 }
        );
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let p = powerUps[i];

        p.y += p.dy;

        if (p.y > canvas.height + 50) {
            powerUps.splice(i, 1);
            continue;
        }

        if (
            p.x + p.w / 2 > paddle.x &&
            p.x - p.w / 2 < paddle.x + paddle.w &&
            p.y + p.h / 2 > paddle.y &&
            p.y - p.h / 2 < paddle.y + paddle.h
        ) {
            if (p.type === "shield") storedShield++;
            if (p.type === "multi") storedMulti++;

            powerUps.splice(i, 1);
        }
    }
}

function drawPowerUps() {
    for (let p of powerUps) {
        ctx.fillStyle = p.type === "shield" ? "lime" : "magenta";
        ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);

        ctx.fillStyle = "black";
        ctx.font = "18px Arial";
        ctx.fillText(p.type === "shield" ? "S" : "M", p.x - 7, p.y + 7);
    }
}

function drawBall(b) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.fillStyle = "cyan";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    if (shield) {
        ctx.beginPath();
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 4;
        ctx.moveTo(0, canvas.height - 5);
        ctx.lineTo(canvas.width, canvas.height - 5);
        ctx.stroke();
        ctx.closePath();
    }
}

function drawBricks() {
    const colors = ["red", "orange", "yellow", "green", "blue"];

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
    ctx.fillText("Shield [Q]: " + storedShield, 150, 25);
    ctx.fillText("Multi [E]: " + storedMulti, 330, 25);

    if (shield) {
        let timeLeft = Math.ceil((shieldEndTime - Date.now()) / 1000);
        ctx.fillText("Shield Active: " + timeLeft + "s", 500, 25);
    }
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "50px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2 - 20);

    ctx.font = "24px Arial";
    ctx.fillText("Press RESTART to play again", canvas.width / 2 - 150, canvas.height / 2 + 30);
}

function drawWinScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "lime";
    ctx.font = "50px Arial";
    ctx.fillText("YOU WIN!", canvas.width / 2 - 120, canvas.height / 2 - 20);

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Press RESTART to play again", canvas.width / 2 - 150, canvas.height / 2 + 30);
}

function handleBallCollisions() {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            let a = balls[i];
            let b = balls[j];

            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let minDistance = a.r + b.r;

            if (distance < minDistance) {
                if (distance === 0) distance = 1;

                let nx = dx / distance;
                let ny = dy / distance;
                let overlap = minDistance - distance;

                a.x -= nx * overlap / 2;
                a.y -= ny * overlap / 2;
                b.x += nx * overlap / 2;
                b.y += ny * overlap / 2;

                let tempDx = a.dx;
                let tempDy = a.dy;

                a.dx = b.dx;
                a.dy = b.dy;

                b.dx = tempDx;
                b.dy = tempDy;
            }
        }
    }
}

function checkWin() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (bricks[r][c].alive) {
                return false;
            }
        }
    }

    return true;
}

function endGame() {
    gameOver = true;
    running = true;
}

function winGame() {
    gameWon = true;
    running = true;
}

function loop() {
    if (!running) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        drawBricks();
        drawPaddle();
        drawScore();
        drawGameOver();
        requestAnimationFrame(loop);
        return;
    }

    if (gameWon) {
        drawBricks();
        drawPaddle();
        drawScore();
        drawWinScreen();
        requestAnimationFrame(loop);
        return;
    }

    if (shield && Date.now() > shieldEndTime) {
        shield = false;
    }

    drawBricks();
    drawPaddle();
    drawScore();
    drawPowerUps();

    updatePowerUps();

    if (paddle.left) paddle.x -= paddle.speed;
    if (paddle.right) paddle.x += paddle.speed;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > canvas.width) {
        paddle.x = canvas.width - paddle.w;
    }

    handleBallCollisions();

    for (let i = balls.length - 1; i >= 0; i--) {
        let b = balls[i];

        drawBall(b);

        if (b.x - b.r <= 0) {
            b.x = b.r;
            b.dx = Math.abs(b.dx);
        }

        if (b.x + b.r >= canvas.width) {
            b.x = canvas.width - b.r;
            b.dx = -Math.abs(b.dx);
        }

        if (b.y - b.r <= 0) {
            b.y = b.r;
            b.dy = Math.abs(b.dy);
        }

        if (
            b.dy > 0 &&
            b.y + b.r >= paddle.y &&
            b.y - b.r <= paddle.y + paddle.h &&
            b.x >= paddle.x &&
            b.x <= paddle.x + paddle.w
        ) {
            b.y = paddle.y - b.r;
            b.dy = -Math.abs(b.dy);
        }

        let hitBrick = false;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let br = bricks[r][c];

                if (
                    br.alive &&
                    b.x + b.r > br.x &&
                    b.x - b.r < br.x + bw &&
                    b.y + b.r > br.y &&
                    b.y - b.r < br.y + bh
                ) {
                    br.alive = false;
                    score++;

                    if (Math.random() < 0.3) {
                        spawnPowerUp(br.x, br.y);
                    }

                    b.dy *= -1;
                    hitBrick = true;
                    break;
                }
            }

            if (hitBrick) break;
        }

        if (b.y + b.r > canvas.height) {
            if (shield) {
                b.y = canvas.height - b.r - 5;
                b.dy = -Math.abs(b.dy);
            } else {
                balls.splice(i, 1);
            }
        }

        b.x += b.dx;
        b.y += b.dy;
    }

    if (balls.length === 0) {
        endGame();
        requestAnimationFrame(loop);
        return;
    }

    if (checkWin()) {
        winGame();
        requestAnimationFrame(loop);
        return;
    }

    requestAnimationFrame(loop);
}
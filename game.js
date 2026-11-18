const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Settings
const MAX_BALL_SPEED = 10;
const BOUNCE_SCORE = 100;   // score where bounce mode starts
const BOUNCE_SPEED = 8;     // how fast the ball travels in bounce mode

// The basket
const basket = {
  x: 200,
  y: 580,
  width: 80,
  height: 20,
  speed: 6
};

// The falling ball
const ball = {
  x: 240,
  y: 0,
  radius: 12,
  speed: 3,
  vx: 0,
  vy: 0,
  bouncing: false
};

let score = 0;
let highScore = Number(localStorage.getItem("catchHighScore")) || 0;
let gameOver = false;
let started = false;

function resetBall() {
  ball.x = Math.random() * (canvas.width - 2 * ball.radius) + ball.radius;
  ball.y = 0;
  ball.vx = 0;
  ball.vy = 0;
  ball.bouncing = false;
}

function restart() {
  score = 0;
  gameOver = false;
  ball.speed = 3;
  resetBall();
}

function endGame() {
  gameOver = true;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("catchHighScore", highScore);
  }
}

// Track which keys are being held down
const keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (!started && e.key === " ") {
    started = true;
  }

  if (gameOver && (e.key === "r" || e.key === "R")) {
    restart();
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// moves the basket so its center sits under the finger
function moveBasketTo(touch) {
  const rect = canvas.getBoundingClientRect();
  const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
  basket.x = x - basket.width / 2;
}

// same action a presing the Space (start) or R (restart)
function handelTap() {
  if (!started) {
    started = true;
  } else if (gameOver) {
    restart();
  }
}

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  handelTap();
  moveBasketTo(e.touches[0]);
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  moveBasketTo(e.touches[0]);
}, { passive: false });

function drawStartScreen() {
  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "48px sans-serif";
  ctx.fillText("Ping Meister", canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = "24px sans-serif";
  ctx.fillText("Tap or press Space to start", canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("Drag or use arrows to move", canvas.width / 2, canvas.height / 2 + 45);

  ctx.textAlign = "left";
}

function drawGameOver() {
  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "48px sans-serif";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = "24px sans-serif";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("High score: " + highScore, canvas.width / 2, canvas.height / 2 + 45);
  ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 90);

  ctx.textAlign = "left";
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!started) {
    drawStartScreen();
    requestAnimationFrame(draw);
    return;
  }

  if (gameOver) {
    drawGameOver();
    requestAnimationFrame(draw);
    return;
  }

  // Move the basket
  if (keys["ArrowLeft"]) basket.x -= basket.speed;
  if (keys["ArrowRight"]) basket.x += basket.speed;

  // Keep the basket inside the canvas
  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > canvas.width) {
    basket.x = canvas.width - basket.width;
  }

  // Move the ball
  if (ball.bouncing) {
    // DVD-style: constant speed, bounce off the side walls and the ceiling
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
    }
  } else {
    // Normal mode: fall straight down
    ball.y += ball.speed;
  }

  // Check for a catch.
  // In bounce mode, only count it when the ball is coming down.
  const caught =
    (!ball.bouncing || ball.vy > 0) &&
    ball.y + ball.radius >= basket.y &&
    ball.y - ball.radius <= basket.y + basket.height &&
    ball.x >= basket.x &&
    ball.x <= basket.x + basket.width;

  if (caught) {
    score++;

    if (score >= BOUNCE_SCORE) {
      // Launch toward the nearest side wall and up
      const towardLeft = ball.x < canvas.width / 2;
      ball.bouncing = true;
      ball.y = basket.y - ball.radius - 1;
      ball.vx = (towardLeft ? -1 : 1) * BOUNCE_SPEED * (0.5 + Math.random() * 0.6);
      ball.vy = -BOUNCE_SPEED * (0.5 + Math.random() * 0.6);
    } else {
      resetBall();

      // Speed up every 5 catches, up to the cap
      if (score % 5 === 0 && ball.speed < MAX_BALL_SPEED) {
        ball.speed += 0.5;
      }
    }
  } else if (ball.y - ball.radius > canvas.height) {
    // Missed the ball: instant game over
    endGame();
  }

  // Draw the basket
  ctx.fillStyle = "gold";
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

  // Draw the ball
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw the score
  ctx.fillStyle = "white";
  ctx.font = "24px sans-serif";
  ctx.fillText("Score: " + score, 16, 32);
  ctx.fillText("High: " + highScore, 16, 60);

  if (ball.bouncing) {
    ctx.fillStyle = "gold";
    ctx.fillText("BOUNCE MODE!", 16, 88);
  }

  requestAnimationFrame(draw);
}

draw();
// Global variables
let gameState = 'start';
let numPlayers = 0;
let currentPlayer = 1;
let players = [];
let target, asteroid;
let strength = 0;
let maxStrength = 100;
let strengthSpeed = 2;
let directionAngle = 0;
let asteroidVelocity;
let spacePressed = false;
let round = 1;
let asteroidPoints = [];
let angle = 0;
let explosion = false;
let explosionX = 0, explosionY = 0;
let explosionFrame = 0;
let asteroidMaxRadius = 0;
let starAlpha = [];
let staticStars = [];
let titlePulse = 0;
let bounceOffset = 0;
let countdown = 10;
let showHitboxes = false;
let earthImg; // Added for image

function preload() {
  earthImg = loadImage('https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f30e.png');
}

function generateStaticStars() {
  staticStars = [];
  for (let i = 0; i < 50; i++) {
    staticStars[i] = { x: random(width), y: random(height), alpha: random(50, 255) };
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  let baseSize = width * 0.02;
  let points = 10;
  asteroidMaxRadius = 0;
  for (let i = 0; i < points; i++) {
    let a = map(i, 0, points, 0, TWO_PI);
    let radius = baseSize * random(0.8, 1.2);
    let vx = cos(a) * radius;
    let vy = sin(a) * radius;
    asteroidPoints.push({ x: vx, y: vy });
    let pointDistance = dist(0, 0, vx, vy);
    if (pointDistance > asteroidMaxRadius) {
      asteroidMaxRadius = pointDistance;
    }
  }

  for (let i = 0; i < 50; i++) {
    starAlpha[i] = random(50, 255);
  }

  generateStaticStars();

  resetGameObjects();
}

function draw() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(0, 0, 50), color(80, 0, 100), inter);
    stroke(c);
    line(0, y, width, y);
  }
  noStroke();

  if (gameState === 'start') {
    for (let i = 0; i < 50; i++) {
      fill(255, starAlpha[i]);
      ellipse(random(width), random(height), 2, 2);
      starAlpha[i] += random(-10, 10);
      starAlpha[i] = constrain(starAlpha[i], 50, 255);
    }
  } else {
    for (let i = 0; i < 50; i++) {
      fill(255, staticStars[i].alpha);
      ellipse(staticStars[i].x, staticStars[i].y, 2, 2);
    }
  }

  if (gameState === 'start') {
    drawStartMenu();
  } else if (gameState === 'playing') {
    drawGame();
    updateGame();
  } else if (gameState === 'scoring') {
    drawGame();
    drawScoringPopup();
  } else if (gameState === 'end') {
    drawEndScreen();
  }
}

function drawStartMenu() {
  rectMode(CORNER);
  textAlign(CENTER, CENTER);
  noStroke();

  textSize(windowWidth * 0.05);
  titlePulse = sin(frameCount * 0.05) * 50 + 200;
  fill(255, 255, 255, 50);
  text('YR4 - Save The Planet!', width / 2, height * 0.265 + 2);
  fill(0, 255, 100, titlePulse);
  text('YR4 - Save The Planet!', width / 2, height * 0.265);

  fill(255, 255, 255, 50);
  rectMode(CENTER);
  rect(width / 2, height * 0.575, width * 0.75, height * 0.35, 20);
  stroke(150, 150, 255);
  noFill();
  rect(width / 2, height * 0.575, width * 0.75 + 4, height * 0.35 + 4, 20);
  noStroke();

  textSize(windowWidth * 0.03);
  fill(255, 255, 0);
  bounceOffset = sin(frameCount * 0.1) * 5;
  text('Press 1, 2, 3, or 4 (Players) to Start', width / 2, height * 0.46 + bounceOffset);

  fill(200);
  text('Game lasts 3 rounds...', width / 2, height * 0.55);
  textSize(windowWidth * 0.025);
  text('Launch the asteroid towards the earth WITHOUT hitting it.', width / 2, height * 0.6);
  text('Aim with mouse, hold Space to charge push,', width / 2, height * 0.65);
  text('Release to launch. Land close to the earth for points.', width / 2, height * 0.70);

  textSize(windowWidth * 0.02);
  fill(255, 100, 100);
  text('Mission begins in ' + floor(countdown) + '...', width * 0.75, height * 0.15);
  if (frameCount % 60 === 0 && countdown > 1) countdown--;
  if (countdown <= 1) countdown = 10;
}

function drawGame() {
  rectMode(CORNER);
  textAlign(CENTER, CENTER);
  noStroke();

  image(earthImg, target.x - width * 0.0375, target.y - width * 0.0375, width * 0.075, width * 0.075);

  push();
  translate(asteroid.x, asteroid.y);
  rotate(angle);
  drawAsteroid(0, 0);
  pop();

  if (explosion) {
    fill(255, 165, 0);
    for (let i = 0; i < 10; i++) {
      let a = random(TWO_PI);
      let speed = random(1, 3) * (1 - explosionFrame / 60);
      let x = explosionX + cos(a) * speed * explosionFrame;
      let y = explosionY + sin(a) * speed * explosionFrame;
      ellipse(x, y, width * 0.01, width * 0.01);
    }
  }

  if (asteroidVelocity.mag() === 0 && gameState === 'playing' && !explosion && strength === 0) {
    stroke(255);
    let lineEndX = asteroid.x + cos(directionAngle) * width * 0.0375;
    let lineEndY = asteroid.y + sin(directionAngle) * width * 0.0375;
    line(asteroid.x, asteroid.y, lineEndX, lineEndY);
    noStroke();
  }

  fill(60);
  rect(width * 0.0625, height * 0.9, width * 0.875, height * 0.033);
  fill(0, 255, 0);
  let barWidth = map(strength, 0, maxStrength, 0, width * 0.875);
  rect(width * 0.0625, height * 0.9, barWidth, height * 0.033);

  fill(255);
  textSize(width * 0.02);
  textAlign(LEFT, CENTER);
  text(`Player ${currentPlayer} - Round ${round}/3`, width * 0.1, height * 0.043);
  textAlign(CENTER, CENTER);
  for (let i = 0; i < numPlayers; i++) {
    text(`P${i + 1}: ${players[i].score}`, width * 0.875, height * 0.043 + i * height * 0.033);
  }

  // Debug hitboxes now conditional
  if (showHitboxes) {
    stroke(255, 0, 0, 100); // Red Earth hitbox
    noFill();
    let earthRadius = width * 0.0375;
    let earthCenterY = target.y - width * 0.00005;
    ellipse(target.x, earthCenterY, earthRadius * 2, earthRadius * 2);
    stroke(0, 0, 255, 100); // Blue asteroid hitbox
    beginShape();
    for (let point of asteroidPoints) {
      let rotatedX = point.x * cos(angle) - point.y * sin(angle);
      let rotatedY = point.x * sin(angle) + point.y * cos(angle);
      vertex(asteroid.x + rotatedX, asteroid.y + rotatedY);
    }
    endShape(CLOSE);
    noStroke();
  }
}

function drawScoringPopup() {
  fill(255, 200);
  rect(width * 0.3125, height * 0.333, width * 0.375, height * 0.333, 20);
  fill(0);
  textSize(width * 0.025);
  let score = calculateScore();
  text(`Score: ${score}`, width / 2, height * 0.416);

  let nextPlayer = (currentPlayer % numPlayers) + 1;
  if (currentPlayer === numPlayers && round === 3) {
    text('See final scores!', width / 2, height * 0.5);
  } else {
    text(`Player ${nextPlayer}, it's your turn!`, width / 2, height * 0.5);
  }

  fill(0, 128, 255);
  rect(width * 0.4375, height * 0.563, width * 0.125, height * 0.066, 10);
  fill(255);
  text('GO!', width / 2, height * 0.596);
}

function drawAsteroid(x, y) {
  fill(165, 100, 80);
  noStroke();
  beginShape();
  for (let point of asteroidPoints) {
    vertex(x + point.x, y + point.y);
  }
  endShape(CLOSE);
}

function drawEndScreen() {
  rectMode(CORNER);
  textAlign(CENTER, CENTER);
  noStroke();

  fill(255);
  textSize(width * 0.04);
  text('Final Score(s)', width / 2, height * 0.25);
  textSize(width * 0.03);
  for (let i = 0; i < numPlayers; i++) {
    text(`Player ${i + 1}: ${players[i].score}`, width / 2, height * 0.4 + i * height * 0.05);
  }
  fill(0, 128, 255);
  rect(width * 0.375, height * 0.583, width * 0.25, height * 0.083, 10);
  fill(255);
  textSize(width * 0.02);
  text('Return to Main Menu', width / 2, height * 0.625);
}

function updateGame() {
  if (spacePressed && asteroidVelocity.mag() === 0) {
    strength += strengthSpeed;
    if (strength >= maxStrength) strength = 0;
  }

  let earthRadius = width * 0.0375;
  let earthCenterY = target.y - width * 0.00005;
  let collision = false;

  let centerDistance = dist(asteroid.x, asteroid.y, target.x, earthCenterY);
  if (centerDistance <= earthRadius + asteroidMaxRadius) {
    for (let point of asteroidPoints) {
      let rotatedX = point.x * cos(angle) - point.y * sin(angle);
      let rotatedY = point.x * sin(angle) + point.y * cos(angle);
      let worldX = asteroid.x + rotatedX;
      let worldY = asteroid.y + rotatedY;
      let distance = dist(worldX, worldY, target.x, earthCenterY);
      if (distance <= earthRadius) {
        collision = true;
        break;
      }
    }
  }

  if (collision && asteroidVelocity.mag() > 0) {
    asteroidVelocity.setMag(0);
    explosion = true;
    explosionX = asteroid.x;
    explosionY = asteroid.y;
    explosionFrame = 0;
  }

  asteroid.add(asteroidVelocity);
  asteroidVelocity.mult(0.98);

  if (explosion) {
    explosionFrame++;
    if (explosionFrame >= 60) {
      explosion = false;
      gameState = 'scoring';
    }
  } else {
    angle += 0.03;
    if (asteroidVelocity.mag() < 0.1 && asteroidVelocity.mag() > 0) {
      asteroidVelocity.setMag(0);
      gameState = 'scoring';
    }
  }

  asteroid.x = constrain(asteroid.x, 0, width);
  asteroid.y = constrain(asteroid.y, 0, height);
}

function calculateScore() {
  let earthRadius = width * 0.0375;
  let earthCenterY = target.y - width * 0.00005;
  let collision = false;

  let centerDistance = dist(asteroid.x, asteroid.y, target.x, earthCenterY);
  if (centerDistance <= earthRadius + asteroidMaxRadius) {
    for (let point of asteroidPoints) {
      let rotatedX = point.x * cos(angle) - point.y * sin(angle);
      let rotatedY = point.x * sin(angle) + point.y * cos(angle);
      let worldX = asteroid.x + rotatedX;
      let worldY = asteroid.y + rotatedY;
      let distance = dist(worldX, worldY, target.x, earthCenterY);
      if (distance <= earthRadius) {
        collision = true;
        break;
      }
    }
  }

  if (collision) return 0;

  if (centerDistance > width * 0.125) return 0;
  return int(map(centerDistance, width * 0.125, earthRadius, 100, 1000));
}

function keyPressed() {
  if (gameState === 'start') {
    if (key >= '1' && key <= '4') {
      numPlayers = int(key);
      for (let i = 0; i < numPlayers; i++) {
        players.push({ score: 0 });
      }
      gameState = 'playing';
    }
  } else if (gameState === 'playing' && key === ' ' && asteroidVelocity.mag() === 0) {
    spacePressed = true;
    return false;
  }
}

function keyReleased() {
  if (gameState === 'playing' && key === ' ' && asteroidVelocity.mag() === 0) {
    spacePressed = false;
    let maxForce = max(width, height) * 0.025;
    let force = map(strength, 0, maxStrength, 0, maxForce);
    asteroidVelocity = p5.Vector.fromAngle(directionAngle).mult(force);
    strength = 0;
  }
}

function mouseMoved() {
  if (gameState === 'playing' && asteroidVelocity.mag() === 0) {
    directionAngle = atan2(mouseY - asteroid.y, mouseX - asteroid.x);
  }
}

function mousePressed() {
  if (gameState === 'scoring') {
    let goButtonX = width * 0.4375;
    let goButtonY = height * 0.563;
    if (mouseX >= goButtonX && mouseX <= goButtonX + width * 0.125 &&
        mouseY >= goButtonY && mouseY <= goButtonY + height * 0.066) {
      players[currentPlayer - 1].score += calculateScore();
      currentPlayer = (currentPlayer % numPlayers) + 1;
      if (currentPlayer === 1) round++;
      if (round > 3) {
        gameState = 'end';
      } else {
        resetGameObjects();
        gameState = 'playing';
      }
    }
  } else if (gameState === 'end') {
    let menuButtonX = width * 0.375;
    let menuButtonY = height * 0.583;
    if (mouseX >= menuButtonX && mouseX <= menuButtonX + width * 0.25 &&
        mouseY >= menuButtonY && mouseY <= menuButtonY + height * 0.083) {
      gameState = 'start';
      numPlayers = 0;
      players = [];
      currentPlayer = 1;
      round = 1;
      resetGameObjects();
    }
  }
}

function resetGameObjects() {
  target = createVector(random(width * 0.125, width * 0.875), random(height * 0.166, height * 0.833));
  do {
    asteroid = createVector(random(width * 0.125, width * 0.875), random(height * 0.166, height * 0.833));
  } while (dist(asteroid.x, asteroid.y, target.x, target.y) < width * 0.125);
  asteroidVelocity = createVector(0, 0);
  strength = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateStaticStars();
}
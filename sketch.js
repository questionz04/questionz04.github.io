// Platformer Template with Wall Jump, Terrain Randomization, and Color Scheme Switching
let player;
let platforms = [];
let gravity = 0.7;
let normalGravity = 0.7;
let wallGravity = 0.2;
let jumpPower = 13;
let moveSpeed = 4;
let keys = {}; 

// Platform count variables
let numSmallPlatforms = 40; // Reduced from 50
let numLargePlatforms = 8; // Reduced from 10
let numMediumPlatforms = 15; // Reduced from 20
let numVeryLargePlatforms = 3; // New very large platforms

// Camera and world dimensions
let cameraX = 0;
let cameraY = 0;
let worldWidth = 1200; // 3 screens wide (600 * 3)
let worldHeight = 8000; // 10 screens tall (400 * 10)

// Track current platform
let currentPlatform = null;
let currentWallPlatform = null; // Track the wall platform
let afterWallJump = false;
let awjtimer = 0;
let playerx = 0;
let playery = 0;
let gameState = 'start'; // 'start' or 'play'
let playButton = {
  x: 0,
  y: 0,
  w: 200,
  h: 60
};

// Color scheme variables
let currentColorScheme = {
  platform: [255, 100, 100],
  background: [20, 20, 40]
};

// Wall jump tracking
let canWallJump = true;

// Zoom and fade transition variables
let isZooming = false;
let zoomLevel = 1;
let fadeAlpha = 0;
let transitionPhase = 'none'; // 'none', 'zoom', 'fadeIn', 'fadeOut'
let originalCameraX = 0;
let originalCameraY = 0;
let targetCameraX = 0;
let targetCameraY = 0;

function setup() {
  createCanvas(600, 400);
  playButton.x = width / 2 - playButton.w / 2;
  playButton.y = height / 2 - playButton.h / 2;
  randomizeTerrain();
  player = new Player(width/2, worldHeight - 100);
}

function draw() {
  background(currentColorScheme.background[0], currentColorScheme.background[1], currentColorScheme.background[2]);
  if (gameState === 'start') {
    // Draw title
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text('Platformer', width/2, height/2 - 80);
    // Draw play button
    fill(80, 180, 80);
    rect(playButton.x, playButton.y, playButton.w, playButton.h, 16);
    fill(255);
    textSize(32);
    text('Play', width/2, height/2);
    return;
  }
  
  // Update zoom transition
  updateZoomTransition();
  
  // --- Game loop ---
  // Update camera to follow player (only when not in transition)
  if (transitionPhase === 'none') {
    cameraX = player.x - width/2;
    cameraY = player.y - height/2;
    
    // Clamp camera to world bounds
    cameraX = constrain(cameraX, 0, worldWidth - width);
    cameraY = constrain(cameraY, 0, worldHeight - height);
  } else if (transitionPhase === 'zoom') {
    // Interpolate camera position during zoom
    let progress = (zoomLevel - 1) / 1; // 1 to 2 zoom range
    cameraX = lerp(originalCameraX, targetCameraX, progress);
    cameraY = lerp(originalCameraY, targetCameraY, progress);
  }
  
  // Apply camera transform
  push();
  translate(-cameraX, -cameraY);
  
  // Apply zoom effect
  if (transitionPhase !== 'none') {
    translate(player.x, player.y);
    scale(zoomLevel);
    translate(-player.x, -player.y);
  }
  
  // Draw world
  for (let plat of platforms) plat.show();
  player.update();
  player.show();
  
  pop();

  // Draw fade overlay
  if (fadeAlpha > 0) {
    fill(255, fadeAlpha);
    rect(0, 0, width, height);
  }

  // Draw distance number only
  fill(255);
  textSize(24);
  textAlign(CENTER, TOP);
  let floorY = worldHeight - 20; // y of the floor
  let distance = max(0, floorY - (player.y + player.h));
  text(nf(distance, 1, 0), width/2, 10);
}

function keyPressed() {
  keys[keyCode] = true;
  if (keyCode === 32) { // Space
    if (transitionPhase === 'none') {
      startZoomTransition();
    }
  }
  if ((keyCode === UP_ARROW || keyCode === 87) && player.onGround) {
    player.vy = -jumpPower;
  }
  // Wall jump on key press
  if ((keyCode === UP_ARROW || keyCode === 87) && player.onWall && !player.onGround && canWallJump) {
    if (player.vx > 0) {
      player.vy = -13;
      player.vx = -4;
    } else if (player.vx < 0) {
      player.vy = -13;
      player.vx = 4;
    }
    afterWallJump = true;
    canWallJump = false;
  }
}

function keyReleased() {
  keys[keyCode] = false;
  // Reset wall jump ability when up arrow is released
  if (keyCode === UP_ARROW || keyCode === 87) {
    canWallJump = true;
  }
}

function startZoomTransition() {
  transitionPhase = 'zoom';
  originalCameraX = cameraX;
  originalCameraY = cameraY;
  targetCameraX = player.x - width/2;
  targetCameraY = player.y - height/2;
  zoomLevel = 1;
  fadeAlpha = 0;
}

function updateZoomTransition() {
  if (transitionPhase === 'zoom') {
    // Zoom in on player and fade to white simultaneously - 5x slower
    zoomLevel += 0.04; // Reduced from 0.2 to 0.04 (5x slower)
    fadeAlpha += 0.4; // Reduced from 2.0 to 0.4 (5x slower)
    if (zoomLevel >= 2) {
      transitionPhase = 'fadeOut';
      zoomLevel = 2;
      fadeAlpha = 255; // Ensure full white
      // Randomize terrain during the white screen
      randomizeTerrain();
    }
  } else if (transitionPhase === 'fadeOut') {
    // Fade out with new layout - 3x faster
    fadeAlpha -= 1.2; // Increased from 0.4 to 1.2 (3x faster)
    if (fadeAlpha <= 0) {
      transitionPhase = 'zoomOut';
      fadeAlpha = 0;
    }
  } else if (transitionPhase === 'zoomOut') {
    // Slowly zoom out to normal FOV
    zoomLevel -= 0.04; // Same speed as zoom in
    if (zoomLevel <= 1) {
      transitionPhase = 'none';
      zoomLevel = 1;
    }
  }
}

function randomizeTerrain() {
  // Choose a new color scheme
  let colorSchemes = [
    { platform: [255, 100, 100], background: [20, 20, 40] },   // Red platforms, dark blue background
    { platform: [100, 255, 100], background: [40, 20, 40] },   // Green platforms, purple background
    { platform: [100, 100, 255], background: [40, 40, 20] },   // Blue platforms, dark yellow background
    { platform: [255, 255, 100], background: [40, 20, 20] },   // Yellow platforms, dark red background
    { platform: [255, 100, 255], background: [20, 40, 20] },   // Magenta platforms, dark green background
    { platform: [100, 255, 255], background: [40, 20, 20] },   // Cyan platforms, dark red background
    { platform: [255, 150, 50], background: [20, 20, 60] },    // Orange platforms, dark blue background
    { platform: [150, 50, 255], background: [60, 20, 20] }     // Purple platforms, dark red background
  ];
  currentColorScheme = random(colorSchemes);
  
  // Store current platform position before clearing
  let preservedPlatform = null;
  if (currentPlatform) {
    preservedPlatform = {
      x: currentPlatform.x,
      y: currentPlatform.y,
      w: currentPlatform.w,
      h: currentPlatform.h
    };
  }
  // Store current wall platform position before clearing
  let preservedWallPlatform = null;
  if (currentWallPlatform) {
    preservedWallPlatform = {
      x: currentWallPlatform.x,
      y: currentWallPlatform.y,
      w: currentWallPlatform.w,
      h: currentWallPlatform.h
    };
  }

  platforms = [];

  // Floor across entire world
  platforms.push(new Platform(0, worldHeight - 20, worldWidth, 20));

  // Grid-based platform generation with platform clustering
  let gridSize = 100;
  let cols = Math.floor(worldWidth / gridSize);
  let rows = Math.floor(worldHeight / gridSize);
  let grid = [];
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      grid[row][col] = 0; // 0 = air, 1 = platform
    }
  }

  // Skip the bottom row (floor) and top few rows
  for (let row = 3; row < rows - 1; row++) {
    for (let col = 0; col < cols; col++) {
      // Count platform neighbors
      let platformNeighbors = 0;
      let neighborCoords = [
        [0, -1], // above
        [0, 1],  // below
        [-1, 0], // left
        [1, 0]   // right
      ];
      for (let [dx, dy] of neighborCoords) {
        let nx = col + dx;
        let ny = row + dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          if (grid[ny][nx] === 1) platformNeighbors++;
        }
      }
      // Base platform chance
      let baseChance = 0.25;
      // Increase platform chance if neighbors are platforms
      let platformBonus = 0.12 * platformNeighbors;
      let platformChance = baseChance + platformBonus;
      if (platformChance > 0.85) platformChance = 0.85; // Don't go above 85% chance
      if (random() < platformChance) {
        grid[row][col] = 1; // Place platform
      }
    }
  }

  // Actually create platforms, avoiding player
  let playerW = 28;
  let playerH = 36;
  let safetyMargin = 20;
  for (let row = 3; row < rows - 1; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === 1) {
        let x = col * gridSize;
        let y = row * gridSize;
        if (!(x < playerx + playerW + safetyMargin && x + gridSize > playerx - safetyMargin &&
              y < playery + playerH + safetyMargin && y + gridSize > playery - safetyMargin)) {
          platforms.push(new Platform(x, y, gridSize, gridSize));
        }
      }
    }
  }

  // Restore the platform the player was standing on
  if (preservedPlatform) {
    let restoredPlatform = new Platform(preservedPlatform.x, preservedPlatform.y, preservedPlatform.w, preservedPlatform.h);
    platforms.push(restoredPlatform);
    currentPlatform = restoredPlatform;
  }
  // Restore the wall platform the player was on
  if (preservedWallPlatform) {
    let restoredWallPlatform = new Platform(preservedWallPlatform.x, preservedWallPlatform.y, preservedWallPlatform.w, preservedWallPlatform.h);
    platforms.push(restoredWallPlatform);
    currentWallPlatform = restoredWallPlatform;
  }
}

class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  show() {
    fill(currentColorScheme.platform[0], currentColorScheme.platform[1], currentColorScheme.platform[2]);
    rect(this.x, this.y, this.w, this.h, 4);
  }
}

function mousePressed() {
  if (gameState === 'start') {
    if (
      mouseX > playButton.x && mouseX < playButton.x + playButton.w &&
      mouseY > playButton.y && mouseY < playButton.y + playButton.h
    ) {
      gameState = 'play';
    }
  }
}
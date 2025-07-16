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
let worldWidth = 8000; // 2x original
let worldHeight = 12000; // 2x original

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

// Fade effect variables
let fadeAlpha = 0;
let isFading = false;
let fadeDirection = 1; // 1 for fade in, -1 for fade out
let fadeSpeed = 10.0; // 3 times faster than before (2.0 * 3 = 6.0)

// Camera zoom variables
let baseZoom = 1.0;
let currentZoom = 1.0;
let targetZoom = 1.0;
let zoomSpeed = 0.1;

// Add a flag to indicate spike respawn
let spikeRespawnPending = false;
// Add a flag to indicate if the player is dead
let playerIsDead = false;

// Store the player's original spawn position
let playerSpawnX, playerSpawnY;

function setup() {
  createCanvas(600, 400); // Half of 1200x800
  playButton.x = width / 2 - playButton.w / 2;
  playButton.y = height / 2 - playButton.h / 2;
  randomizeTerrain();
  player = new Player(worldWidth/2, worldHeight - 50);
  // Store original spawn position
  playerSpawnX = worldWidth/2;
  playerSpawnY = worldHeight - 50;
}

function draw() {
  background(0, 0, 0);
  if (gameState === 'start') {
    // Draw title
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48); // original
    text('Platformer', width/2, height/2 - 80);
    // Draw play button
    fill(80, 180, 80);
    rect(playButton.x, playButton.y, playButton.w, playButton.h, 16);
    fill(255);
    textSize(32);
    text('Play', width/2, height/2);
    return;
  }
  // --- Game loop ---
  // Update camera to follow player
  cameraX = player.x - width/4; // width/2 divided by 2
  cameraY = player.y - height/4; // height/2 divided by 2
  
  // Clamp camera to world bounds
  cameraX = constrain(cameraX, 0, worldWidth - width/2);
  cameraY = constrain(cameraY, 0, worldHeight - height/2);
  
  // Handle zoom effect during fade
  if (isFading) {
    if (fadeDirection === 1) {
      // Zoom in during fade in
      targetZoom = 2.0;
    } else {
      // Zoom out during fade out
      targetZoom = 1.0;
    }
  } else {
    targetZoom = 1.0;
  }
  
  // Smooth zoom transition
  currentZoom = lerp(currentZoom, targetZoom, zoomSpeed);
  
  // Apply camera transform with zoom
  push();
  // scale(2/3); // REMOVE scaling
  translate(width/4, height/4); // width/2 and height/2 divided by 2
  scale(currentZoom); // apply zoom after scaling
  translate(-cameraX - width/4, -cameraY - height/4);
  
  // Draw world
  for (let plat of platforms) plat.show();
  // Only update and show player if not dead
  if (!player.isDead) {
    player.update();
    player.show();
  }
  
  // Check for spike collision
  for (let plat of platforms) {
    if (plat.hasSpikes) {
      // Check if player is overlapping the spike area (top of platform)
      let spikeTop = plat.y - 14; // spike height
      let spikeBottom = plat.y;
      let spikeLeft = plat.x;
      let spikeRight = plat.x + plat.w;
      let playerBottom = player.y + player.h;
      let playerTop = player.y;
      let playerLeft = player.x;
      let playerRight = player.x + player.w;
      // Simple AABB collision with spike area
      if (
        playerRight > spikeLeft &&
        playerLeft < spikeRight &&
        playerBottom > spikeTop &&
        playerTop < spikeBottom
      ) {
        if (!player.isDead && !spikeRespawnPending && !isFading) {
          player.isDead = true;
          isFading = true;
          fadeAlpha = 0;
          fadeDirection = 1;
          spikeRespawnPending = true;
        }
      }
    }
  }

  pop();

  // Draw distance number only
  fill(255);
  textSize(24);
  textAlign(CENTER, TOP);
  let floorY = worldHeight; // y of the floor
  let distance = max(0, floorY - (player.y + player.h));
  text(nf(distance, 1, 0), width/2, 10);

  // Draw dash cooldown bar (bottom left)
  let barWidth = 120;
  let barHeight = 16;
  let barX = 20;
  let barY = height - barHeight - 20;
  let dashMax = 90; // must match player.dashCooldown max
  let dashProgress = 1 - (player.dashCooldown / dashMax);
  // Background
  fill(40, 40, 40, 180);
  rect(barX, barY, barWidth, barHeight, 8);
  // Foreground (progress)
  fill(80, 180, 255, 220);
  rect(barX, barY, barWidth * dashProgress, barHeight, 8);
  // Border
  noFill();
  stroke(255);
  strokeWeight(2);
  rect(barX, barY, barWidth, barHeight, 8);
  noStroke();
  
  // Handle fade effect
  if (isFading) {
    fadeAlpha += fadeDirection * fadeSpeed;
    
    if (fadeDirection === 1 && fadeAlpha >= 255) {
      // Fade in complete, start fade out
      fadeAlpha = 255;
      fadeDirection = -1;
      // Randomize terrain here
      if (spikeRespawnPending) {
        // Respawn player at original spawn location
        player.x = playerSpawnX;
        player.y = playerSpawnY;
        player.vx = 0;
        player.vy = 0;
        player.isDead = false;
        spikeRespawnPending = false;
        // Do NOT explode into particles here
      } else {
        randomizeTerrain();
      }
    } else if (fadeDirection === -1 && fadeAlpha <= 0) {
      // Fade out complete
      fadeAlpha = 0;
      isFading = false;
    }
    
    // Draw white fade overlay
    fill(255, fadeAlpha);
    rect(0, 0, width, height);
  }
}

function keyPressed() {
  keys[keyCode] = true;
  if (keyCode === 32) { // Space
    if (!isFading) {
      // Start fade effect
      isFading = true;
      fadeAlpha = 0;
      fadeDirection = 1;
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
      player.facing = -1; // face left after jumping off right wall
    } else if (player.vx < 0) {
      player.vy = -13;
      player.vx = 4;
      player.facing = 1; // face right after jumping off left wall
    }
    afterWallJump = true;
    canWallJump = false;
  }
  // Dash on X key (88)
  if (keyCode === 88 && player.dashCooldown === 0 && !player.isDashing) {
    player.isDashing = true;
    player.dashCooldown = 90; // new cooldown
  }
}

function keyReleased() {
  keys[keyCode] = false;
  // Reset wall jump ability when up arrow is released
  if (keyCode === UP_ARROW || keyCode === 87) {
    canWallJump = true;
  }
}

function randomizeTerrain() {
  // Choose a new color scheme
  let colorSchemes = [
    // Rainbow colors
    { platform: [255, 0, 0], background: [0, 0, 0] },      // Red
    { platform: [255, 127, 0], background: [0, 0, 0] },    // Orange
    { platform: [255, 255, 0], background: [0, 0, 0] },    // Yellow
    { platform: [0, 255, 0], background: [0, 0, 0] },      // Green
    { platform: [0, 0, 255], background: [0, 0, 0] },      // Blue
    { platform: [75, 0, 130], background: [0, 0, 0] },     // Indigo
    { platform: [148, 0, 211], background: [0, 0, 0] },    // Violet
    // Current/previous platform colors
    { platform: [255, 100, 100], background: [0, 0, 0] },  // Light Red
    { platform: [100, 255, 100], background: [0, 0, 0] },  // Light Green
    { platform: [100, 100, 255], background: [0, 0, 0] },  // Light Blue
    { platform: [255, 255, 100], background: [0, 0, 0] },  // Light Yellow
    { platform: [255, 100, 255], background: [0, 0, 0] },  // Magenta
    { platform: [100, 255, 255], background: [0, 0, 0] },  // Cyan
    { platform: [255, 150, 50], background: [0, 0, 0] },   // Orange
    { platform: [150, 50, 255], background: [0, 0, 0] }    // Purple
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

  // No bottom platform; generate platforms down to worldHeight + 1000
  // Grid-based platform generation with platform clustering
  let gridSize = 100;
  let cols = Math.floor(worldWidth / gridSize);
  let rows = Math.floor((worldHeight + 1000) / gridSize);
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
      // 100% chance for platforms at y levels 20 to -20
      let yLevel = row * gridSize;
      if (yLevel >= worldHeight-20 && yLevel <= worldHeight+20) {
        platformChance = 1.0;
      }
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
          // Only generate spikes if the platform's top is exposed (no platform above)
          let hasPlatformAbove = false;
          if (row > 0 && grid[row-1][col] === 1) hasPlatformAbove = true;
          // Prevent spikes at the player's spawn point
          let overlapsSpawn = false;
          if (
            x < playerSpawnX + playerW &&
            x + gridSize > playerSpawnX &&
            y < playerSpawnY + playerH &&
            y + gridSize > playerSpawnY
          ) {
            overlapsSpawn = true;
          }
          let hasSpikes = !hasPlatformAbove && !overlapsSpawn && random() < 0.12; // 12% chance, only if top is exposed and not at spawn
          platforms.push(new Platform(x, y, gridSize, gridSize, hasSpikes));
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
  constructor(x, y, w, h, hasSpikes = false) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.hasSpikes = hasSpikes;
  }
  show() {
    fill(currentColorScheme.platform[0], currentColorScheme.platform[1], currentColorScheme.platform[2]);
    rect(this.x, this.y, this.w, this.h, 4);
    // Draw spikes if present
    if (this.hasSpikes) {
      fill(200);
      let numSpikes = Math.floor(this.w / 16);
      for (let i = 0; i < numSpikes; i++) {
        let sx = this.x + i * 16;
        let sy = this.y;
        triangle(sx, sy, sx + 8, sy - 14, sx + 16, sy);
      }
    }
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
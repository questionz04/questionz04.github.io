class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 28;
    this.h = 36;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.onWall = false;
    this.particles = []; // Array to store particle trail
    this.lastX = x; // Track previous position for movement detection
    this.lastY = y;
    this.groundTimer = 0; // Timer for ground particle activation
    this.wallTimer = 0; // Timer for wall particle activation
  }
  
  // Add particle to trail
  addParticle(x, y, color) {
    this.particles.push({
      x: x,
      y: y,
      vx: random(-1, 1),
      vy: random(-0.5, -0.1),
      life: 30,
      maxLife: 30,
      color: color,
      isWallParticle: false
    });
  }
  
  // Add wall sliding particle
  addWallParticle(x, y, color) {
    this.particles.push({
      x: x,
      y: y,
      vx: random(-0.5, 0.5),
      vy: 0,
      life: 20,
      maxLife: 20,
      color: color,
      isWallParticle: true
    });
  }
  
  // Update particles
  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      
      p.life--;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  // Draw ground particles (behind player)
  drawGroundParticles() {
    for (let p of this.particles) {
      if (!p.isWallParticle) {
        let alpha = map(p.life, 0, p.maxLife, 0, 127);
        fill(p.color[0], p.color[1], p.color[2], alpha);
        noStroke();
        rect(p.x - 3, p.y - 3, 6, 6);
      }
    }
  }
  
  // Draw wall particles (in front of player)
  drawWallParticles() {
    for (let p of this.particles) {
      if (p.isWallParticle) {
        let alpha = map(p.life, 0, p.maxLife, 0, 127);
        fill(p.color[0], p.color[1], p.color[2], alpha);
        noStroke();
        rect(p.x - 3, p.y - 3, 6, 6);
      }
    }
  }
  
  update() {
    // Horizontal movement
    if(this.onGround==true){
      afterWallJump=false
    }
    if(afterWallJump==false){
      if (keyIsDown(LEFT_ARROW)) {
      if(abs(this.vx<=moveSpeed)){
        this.vx += -moveSpeed/5;
      }
    } else if (keyIsDown(RIGHT_ARROW)) {
      if(abs(this.vx<=moveSpeed)){
        this.vx += moveSpeed/5;
      }
    } else if(this.onGround==true){
      if(this.vx>0){
        this.vx-=0.4
      }
      if(this.vx<0){
        this.vx+=0.4
      }
      if(abs(this.vx)<0.4){
        this.vx=0
      }
    }
    }else {
      if(this.vx>0){
        this.vx-=0.01
      }
      if(this.vx<0){
        this.vx+=0.01
      }
      if(abs(this.vx)<0.2){
        this.vx=0
      }
      if (keyIsDown(LEFT_ARROW)) {
      if(abs(this.vx<=moveSpeed)){
        this.vx += -moveSpeed/40;
      }
    } else if (keyIsDown(RIGHT_ARROW)) {
      if(abs(this.vx<=moveSpeed)){
        this.vx += moveSpeed/40;
      }
    }
    }
    if(abs(this.vx)>=moveSpeed){
      if(this.vx>0){
        this.vx=moveSpeed-0.01
      }
      if(this.vx<0){
        this.vx=-moveSpeed-0.01
      }
    }
    playerx = this.x
    playery = this.y
    if(afterWallJump==true){
      awjtimer+=1
    }
    if(awjtimer>30){
      afterWallJump=false
      awjtimer=0
    }
    // Reset wall detection before collision checks
    this.onWall = false;
    if(this.onWall == true || this.onGround == true){
      afterWallJump=false
      awjtimer=0
    }
    // Gravity - only apply acceleration when not on wall
    if (!this.onWall) {
      this.vy += gravity;
    } else {
      // Constant fall speed when on wall, but normal gravity when moving upward
      if (this.vy < 0) {
        this.vy += gravity; // Normal gravity when moving upward on wall
      } else {
        this.vy = 0.7; // Constant speed when sliding down wall
      }
    }
    if (this.vy > 16) this.vy = 16;
    // Move and collide
    this.x += this.vx;
    this.collide('x');
    this.y += this.vy;
    this.collide('y');
    
    // Keep player in world bounds
    this.x = constrain(this.x, 0, worldWidth - this.w);
    this.y = constrain(this.y, 0, worldHeight - this.h);
    
    // Update timers
    if (this.onGround) {
      this.groundTimer++;
    } else {
      this.groundTimer = 0;
    }
    
    if (this.onWall) {
      this.wallTimer++;
    } else {
      this.wallTimer = 0;
    }
    
    // Generate particles when moving on ground (after 6 frames = ~0.10 seconds at 60fps)
    if (this.onGround && currentPlatform && this.groundTimer > 6) {
      let moved = abs(this.x - this.lastX) > 0.1 || abs(this.y - this.lastY) > 0.1;
      if (moved && random() < 0.5) { // 50% chance to generate particle
        // Add particles very close to the ground
        let particleX = this.x + this.w/2 + random(-3, 3);
        let particleY = this.y + this.h - 1;
        this.addParticle(particleX, particleY, currentColorScheme.platform);
      }
    }
    
    // Generate wall sliding particles (after 6 frames = ~0.10 seconds at 60fps)
    if (this.onWall && currentWallPlatform && this.vy > 0 && this.wallTimer > 6) {
      if (random() < 0.5) { // 50% chance to generate particle
        // Add wall particles slightly lower when sliding down
        let particleX = this.x + (this.vx > 0 ? this.w : 0) + random(-3, 3);
        let particleY = this.y - 2 + random(-3, 3);
        this.addWallParticle(particleX, particleY, currentColorScheme.platform);
      }
    }
    
    // Update particles
    this.updateParticles();
    
    // Update last position
    this.lastX = this.x;
    this.lastY = this.y;
  }
  
  collide(axis) {
    this.onGround = false;
    currentPlatform = null;
    if (axis === 'x') currentWallPlatform = null;
    for (let plat of platforms) {
      if (this.x < plat.x + plat.w && this.x + this.w > plat.x &&
          this.y < plat.y + plat.h && this.y + this.h > plat.y) {
        if (axis === 'y') {
          if (this.vy > 0) {
            this.y = plat.y - this.h;
            this.vy = 0;
            this.onGround = true;
            currentPlatform = plat;
          } else if (this.vy < 0) {
            this.y = plat.y + plat.h;
            this.vy = 0;
          }
        } else if (axis === 'x') {
          if (this.vx > 0) {
            this.x = plat.x - this.w;
            this.onWall = true;
            this.vx = 0.0000000001;
            if(this.vy>0){
              this.vy = 0.7
            }
            afterWallJump = false;
            awjtimer = 0;
            currentWallPlatform = plat;
          } else if (this.vx < 0) {
            this.x = plat.x + plat.w;
            this.onWall = true;
            this.vx = -0.0000000001;
            if(this.vy>0){
              this.vy = 0.7
            }
            afterWallJump = false;
            awjtimer = 0;
            currentWallPlatform = plat;
          }
        }
      }
    }
  }
  
  show() {
    // Draw ground particles first (behind player)
    this.drawGroundParticles();
    
    // Draw player
    fill(128);
    rect(this.x, this.y, this.w, this.h, 6);
    
    // Draw wall particles after player (in front)
    this.drawWallParticles();
  }
 }
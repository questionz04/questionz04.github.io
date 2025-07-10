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
    fill(128);
    rect(this.x, this.y, this.w, this.h, 6);
  }
}
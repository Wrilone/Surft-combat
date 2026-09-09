export abstract class Entity {
  public x = 0;
  public y = 0;
  public prevX = 0;
  public prevY = 0;
  public vx = 0;
  public vy = 0;
  public width = 16;
  public height = 16;
  public alive = false;

  // Hitbox relative offset and dimensions
  public hitboxOffsetX = 0;
  public hitboxOffsetY = 0;
  public hitboxWidth = 16;
  public hitboxHeight = 16;

  public setHitbox(w: number, h: number, offsetX?: number, offsetY?: number) {
    this.hitboxWidth = w;
    this.hitboxHeight = h;
    this.hitboxOffsetX = offsetX ?? (this.width - w) / 2;
    this.hitboxOffsetY = offsetY ?? (this.height - h) / 2;
  }

  public getHitbox() {
    return {
      x: this.x + this.hitboxOffsetX,
      y: this.y + this.hitboxOffsetY,
      w: this.hitboxWidth,
      h: this.hitboxHeight,
    };
  }

  public savePrevPos() {
    this.prevX = this.x;
    this.prevY = this.y;
  }

  public abstract update(dt: number, bounds: { width: number; height: number }): void;
}

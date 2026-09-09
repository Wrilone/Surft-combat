import { CONFIG } from '../config';
import { Entity } from '../entities/Entity';

export interface HitboxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function checkAABB(a: HitboxRect, b: HitboxRect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export class SpatialHashGrid {
  private cellSize: number;
  private grid = new Map<string, Entity[]>();
  private entityBuckets = new Map<Entity, string[]>();

  constructor(cellSize = CONFIG.SPATIAL_HASH_CELL_SIZE) {
    this.cellSize = cellSize;
  }

  public clear() {
    for (const list of this.grid.values()) {
      list.length = 0;
    }
    this.entityBuckets.clear();
  }

  private getKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  public insert(entity: Entity) {
    const box = entity.getHitbox();
    const minCx = Math.floor(box.x / this.cellSize);
    const maxCx = Math.floor((box.x + box.w) / this.cellSize);
    const minCy = Math.floor(box.y / this.cellSize);
    const maxCy = Math.floor((box.y + box.h) / this.cellSize);

    const keys: string[] = [];

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = this.getKey(cx, cy);
        let list = this.grid.get(key);
        if (!list) {
          list = [];
          this.grid.set(key, list);
        }
        list.push(entity);
        keys.push(key);
      }
    }

    this.entityBuckets.set(entity, keys);
  }

  public getPotentialColliders(entity: Entity, result: Set<Entity>): void {
    result.clear();
    const box = entity.getHitbox();
    const minCx = Math.floor(box.x / this.cellSize);
    const maxCx = Math.floor((box.x + box.w) / this.cellSize);
    const minCy = Math.floor(box.y / this.cellSize);
    const maxCy = Math.floor((box.y + box.h) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = this.getKey(cx, cy);
        const list = this.grid.get(key);
        if (list) {
          for (let i = 0; i < list.length; i++) {
            const other = list[i];
            if (other !== entity && other.alive) {
              result.add(other);
            }
          }
        }
      }
    }
  }
}

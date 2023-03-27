import type { Vector } from '@dimforge/rapier3d-compat'

export const length = (v: Vector): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

export const normalize = (v: Vector): Vector => {
  const l = length(v)
  return {
    x: v.x / l,
    y: v.y / l,
    z: v.z / l
  }
}

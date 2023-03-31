import type { Vector3 } from 'three'

export type CarState = {
  isForward: boolean
  isBraking: boolean
  velocity: number
  worldPosition: Vector3
  /**
   * in radians
   */
  steeringAngle: number
}

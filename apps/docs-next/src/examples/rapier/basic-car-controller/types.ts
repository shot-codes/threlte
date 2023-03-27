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
  // FORWARD IMPULSE
  forwardImpulse: {
    origin: { x: number; y: number; z: number }
    direction: { x: number; y: number; z: number }
    length: number
  }
  // STEERING TORQUE
  steeringTorque: {
    origin: { x: number; y: number; z: number }
    direction: { x: number; y: number; z: number }
    length: number
  }
  // SIDE IMPULSE
  sideImpulse: {
    origin: { x: number; y: number; z: number }
    direction: { x: number; y: number; z: number }
    length: number
  }
}

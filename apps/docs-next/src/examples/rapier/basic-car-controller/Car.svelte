<!--

-->
<script lang="ts">
  import {
    Collider as RapierCollider,
    Ray,
    RigidBody as RapierRigidBody,
    RigidBodyType,
    Rotation as RapierRotation,
    Rotation,
    Vector as RapierVector
  } from '@dimforge/rapier3d-compat'
  import { T, useFrame } from '@threlte/core'
  import { Audio, Text } from '@threlte/extras'
  import { Collider, computeBitMask, RigidBody, useRapier } from '@threlte/rapier'
  import { mapRange } from '@tweakpane/core'
  import { spring } from 'svelte/motion'
  import { Euler, Group, Object3D, Quaternion, Vector3 } from 'three'
  import { clamp, lerp, mapLinear } from 'three/src/math/MathUtils'
  import type { CarState } from './types'
  import { useArrowKeys } from './useArrowKeys'
  import { fromAToB, length, normalize } from './vectorUtils'

  const { world, paused } = useRapier()

  let rigidBody: RapierRigidBody

  let collider: RapierCollider
  let group: Group
  let dummyGroup: Group
  let innerGroup: Group

  const steeringAngle = spring(0)

  const axis = useArrowKeys()

  enum Wheel {
    'FL' = 'FL',
    'FR' = 'FR',
    'RL' = 'RL',
    'RR' = 'RR'
  }

  export let debug = false

  type WheelState = {
    type: Wheel
    onGround: boolean
    suspensionLength: number
    ray: Ray
    surfaceImpactPoint: RapierVector
    surfaceImpactNormal: RapierVector
    wheelGroup: Group
  }

  /**
   * -------------------------------------------------------
   * CAR CONFIGURATION
   * -------------------------------------------------------
   */

  const spawnPosition: {
    x: number
    y: number
    z: number
  } = {
    x: 0,
    y: 5.5,
    z: 0
  }

  /**
   * In degrees
   */
  const maxSteeringAngle = 35

  const carWeight = 1500
  /**
   * In units/s
   */
  const maxDesiredVelocity = 75

  // const suspensionMountHeightRelativeToCarFloor = 0
  const suspensionStiffness = 0.5
  const suspensionDamping = 0.03

  // ~ VW Passat dimensions
  const carBodyHeight = 1.12
  const carBodyWidth = 1.9
  const carBodyLength = 4.5
  const carBodyRadius = 0.3

  // 16 inch wheels have ~0.2m radius
  const wheelRadius = 0.306

  // racing cars have ~0.05m ground clearance
  const maxGroundClearance = 0.25

  // ~ VW Passat wheelbase
  const wheelBase = 2.56

  const suspensionImpulseMultiplier = 1600
  const forwardImpulseMultiplier = 800
  const forwardImpulseMap = (_t: number) => 1
  const backwardImpulseMultiplier = 400
  const backwardImpulseMap = (_t: number) => 1
  const brakeImpulseMultiplier = 1400
  const brakeImpulseMap = (_t: number) => 1

  /**
   * Maps the inclination to the power of the impulse applied to the wheels. The
   * incliniation goes from 0 (car is on a vertical surface going down) to 1
   * (car is on a vertical surface going up) where 0.5 is horizontal.
   */
  // https://ease-everything.vercel.app/?path=%255B%2522Path%2522%252C%257B%2522applyMatrix%2522%253Atrue%252C%2522segments%2522%253A%255B%255B0%252C400%255D%252C%255B200%252C375%255D%252C%255B300%252C325%255D%252C%255B350%252C250%255D%252C%255B400%252C100%255D%255D%252C%2522strokeColor%2522%253A%255B0.05882%252C0.38039%252C0.99608%255D%252C%2522strokeWidth%2522%253A2%257D%255D
  const forwardImpulseInclinationMap = (t: number) => {
    if (t < 0.5) return ((0.9375 - 1) / (0.5 - 0)) * (t - 0) + 1
    if (t < 0.75) return ((0.8125 - 0.9375) / (0.75 - 0.5)) * (t - 0.5) + 0.9375
    if (t < 0.875) return ((0.6875 - 0.8125) / (0.875 - 0.75)) * (t - 0.75) + 0.8125
    return ((0.375 - 0.6875) / (1 - 0.875)) * (t - 0.875) + 0.6875
  }

  const steeringTorqueMultiplier = 250
  const sideImpulseMultiplier = 140

  /**
   * Steering torque is only applied if the velocity is above this threshold.
   */
  const steeringVelocityThreshold = 0.3

  // https://ease-everything.vercel.app/?path=%255B%2522Path%2522%252C%257B%2522applyMatrix%2522%253Atrue%252C%2522segments%2522%253A%255B%255B0%252C0%255D%252C%255B%255B50%252C400%255D%252C%255B-25%252C0%255D%252C%255B75%252C0%255D%255D%252C%255B200%252C300%255D%252C%255B400%252C100%255D%255D%252C%2522strokeColor%2522%253A%255B0.05882%252C0.38039%252C0.99608%255D%252C%2522strokeWidth%2522%253A2%257D%255D
  const steeringMap = (t: number) => {
    const kSTS = 11
    const kSSS = 1 / (kSTS - 1)
    const map = (n: number, t: number, S: number, r: number, u: number) =>
      ((n - t) * (u - r)) / (S - t) + r
    const A = (n: number, t: number) => 1 - 3 * t + 3 * n
    const B = (n: number, t: number) => 3 * t - 6 * n
    const C = (n: number) => 3 * n
    const cB = (n: number, t: number, S: number) => ((A(t, S) * n + B(t, S)) * n + C(t)) * n
    const gS = (n: number, t: number, S: number) => 3 * A(t, S) * n * n + 2 * B(t, S) * n + C(t)
    const bS = (n: number, t: number, S: number, r: number, u: number) => {
      let c,
        o,
        e = 0
      do {
        ;(c = cB((o = t + (S - t) / 2), r, u) - n) > 0 ? (S = o) : (t = o)
      } while (Math.abs(c) > 1e-7 && ++e < 10)
      return o
    }
    const nRI = (n: number, t: number, S: number, r: number) => {
      for (let u = 0; u < 4; ++u) {
        const u = gS(t, S, r)
        if (0 === u) return t
        t -= (cB(t, S, r) - n) / u
      }
      return t
    }
    const b = (n: number, t: number, S: number, r: number) => {
      if (!(0 <= n && n <= 1 && 0 <= S && S <= 1)) throw new Error('Error resolving bezier')
      const u = new Float32Array(kSTS)
      if (n !== t || S !== r) for (let t = 0; t < kSTS; ++t) u[t] = cB(t * kSSS, n, S)
      return (c: number) =>
        n === t && S === r
          ? c
          : 0 === c || 1 === c
          ? c
          : cB(
              (function (t) {
                let r = 0,
                  c = 1
                const o = kSTS - 1
                for (; c !== o && u[c] <= t; ++c) r += kSSS
                const e = r + ((t - u[--c]) / (u[c + 1] - u[c])) * kSSS,
                  f = gS(e, n, S)
                return f >= 0.001 ? nRI(t, e, n, S) : 0 === f ? e : bS(t, r, r + kSSS, n, S)
              })(c),
              t,
              r
            )
    }

    if (t < 0.125)
      return map(b(0, 0, 0.5, 1)(((t - 0) * (1 - 0)) / (0.125 - 0) + 0 * 2), 0, 1, 0, 1)
    if (t < 0.5)
      return map(b(0.5, 0, 1, 1)(((t - 0.125) * (1 - 0)) / (0.5 - 0.125) + 0 * 2), 0, 1, 1, 0.75)
    return ((0.25 - 0.75) / (1 - 0.5)) * (t - 0.5) + 0.75
  }

  // https://ease-everything.vercel.app/?path=%255B%2522Path%2522%252C%257B%2522applyMatrix%2522%253Atrue%252C%2522segments%2522%253A%255B%255B0%252C350%255D%252C%255B150%252C400%255D%252C%255B400%252C125%255D%255D%252C%2522strokeColor%2522%253A%255B0.05882%252C0.38039%252C0.99608%255D%252C%2522strokeWidth%2522%253A2%257D%255D
  const visualSteeringMap = (t: number) => {
    if (t < 0.3125) return ((1 - 0.875) / (0.3125 - 0)) * (t - 0) + 0.875
    return ((0.3125 - 1) / (1 - 0.3125)) * (t - 0.3125) + 1
  }

  const angularDamping = 4
  const angularDampingWhenBelowSteeringVelocityThreshold = 40
  const angularDampingWhenInAir = 0.1
  const angularDampingWhenBrakingInAir = 14

  const linearDamping = 0.3
  const linearDampingWhenInAir = 0.1
  const linearDampingWhenBrakingInAir = 0.5

  const virtualCenterOfMass = new Vector3(0.15, -0.25, 0)

  // https://ease-everything.vercel.app/?path=%255B%2522Path%2522%252C%257B%2522applyMatrix%2522%253Atrue%252C%2522segments%2522%253A%255B%255B0%252C0%255D%252C%255B25%252C200%255D%252C%255B100%252C400%255D%252C%255B100%252C225%255D%252C%255B200%252C400%255D%252C%255B200%252C275%255D%252C%255B300%252C400%255D%252C%255B300%252C300%255D%252C%255B400%252C400%255D%255D%252C%2522strokeColor%2522%253A%255B0.05882%252C0.38039%252C0.99608%255D%252C%2522strokeWidth%2522%253A2%257D%255D
  const soundPlaybackMap = (t: number) => {
    if (t < 0.0625) return ((0.5 - 0) / (0.0625 - 0)) * (t - 0) + 0
    if (t < 0.25) return ((1 - 0.5) / (0.25 - 0.0625)) * (t - 0.0625) + 0.5
    if (t < 0.25) return ((0.5625 - 1) / (0.25 - 0.25)) * (t - 0.25) + 1
    if (t < 0.5) return ((1 - 0.5625) / (0.5 - 0.25)) * (t - 0.25) + 0.5625
    if (t < 0.5) return ((0.6875 - 1) / (0.5 - 0.5)) * (t - 0.5) + 1
    if (t < 0.75) return ((1 - 0.6875) / (0.75 - 0.5)) * (t - 0.5) + 0.6875
    if (t < 0.75) return ((0.75 - 1) / (0.75 - 0.75)) * (t - 0.75) + 1
    return ((1 - 0.75) / (1 - 0.75)) * (t - 0.75) + 0.75
  }
  const minPlaybackRate = 1
  const maxPlaybackRate = 3.5
  const idleVolume = 0.6
  const loadVolume = 1.0
  /**
   * Defines, how much the engine noise is reduced in volume when the
   * playbackRate is at minPlaybackRate comapred to maxPlaybackRate.
   */
  const volumePlaybackRateMultiplier = 0.4
  /**
   * -------------------------------------------------------
   * CAR CONFIGURATION END
   * -------------------------------------------------------
   */

  /**
   * -------------------------------------------------------
   * VIEW CONFIGURATION
   * -------------------------------------------------------
   */

  const desiredCameraDistance = 8
  const desiredCameraHeight = 3
  const cameraDistanceToWalls = 0.5

  /**
   * -------------------------------------------------------
   * VIEW CONFIGURATION END
   * -------------------------------------------------------
   */

  const spawn = () => {
    if (!rigidBody || !group) return
    if (rigidBody.bodyType() !== RigidBodyType.Dynamic) {
      rigidBody.setBodyType(RigidBodyType.Dynamic, true)
    }
    rigidBody.setTranslation(
      {
        x: spawnPosition.x,
        y: carBodyHeight / 2 + maxGroundClearance + spawnPosition.y,
        z: spawnPosition.z
      },
      true
    )
    rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
    rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true)
    rigidBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    group.quaternion.set(0, 0, 0, 1)
  }

  // as soon as the rigidBody is available, we set its position and type to dynamic
  $: if (rigidBody) spawn()

  const respawn = () => spawn()

  // the total length of the suspension travel

  const defaultRay = new Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 })

  let wheelStates: Record<Wheel, WheelState> = {
    FL: {
      type: Wheel.FL,
      onGround: false,
      suspensionLength: maxGroundClearance,
      ray: defaultRay,
      surfaceImpactNormal: { x: 0, y: 0, z: 0 },
      surfaceImpactPoint: { x: 0, y: 0, z: 0 },
      wheelGroup: undefined as any as Group
    },
    FR: {
      type: Wheel.FR,
      onGround: false,
      suspensionLength: maxGroundClearance,
      ray: defaultRay,
      surfaceImpactNormal: { x: 0, y: 0, z: 0 },
      surfaceImpactPoint: { x: 0, y: 0, z: 0 },
      wheelGroup: undefined as any as Group
    },
    RL: {
      type: Wheel.RL,
      onGround: false,
      suspensionLength: maxGroundClearance,
      ray: defaultRay,
      surfaceImpactNormal: { x: 0, y: 0, z: 0 },
      surfaceImpactPoint: { x: 0, y: 0, z: 0 },
      wheelGroup: undefined as any as Group
    },
    RR: {
      type: Wheel.RR,
      onGround: false,
      suspensionLength: maxGroundClearance,
      ray: defaultRay,
      surfaceImpactNormal: { x: 0, y: 0, z: 0 },
      surfaceImpactPoint: { x: 0, y: 0, z: 0 },
      wheelGroup: undefined as any as Group
    }
  }

  export let carState: CarState = {
    isForward: false,
    isBraking: false,
    worldPosition: new Vector3(),
    steeringAngle: 0,
    forwardImpulse: {
      direction: { x: 0, y: 0, z: 0 },
      origin: { x: 0, y: 0, z: 0 },
      length: 0
    },
    steeringTorque: {
      direction: { x: 0, y: 0, z: 0 },
      origin: { x: 0, y: 0, z: 0 },
      length: 0
    },
    sideImpulse: {
      direction: { x: 0, y: 0, z: 0 },
      origin: { x: 0, y: 0, z: 0 },
      length: 0
    },
    velocity: 0
  }

  let playbackRate = minPlaybackRate
  let volume = idleVolume

  /**
   * -------------------------------------------------------
   * TEMP VARIABLES
   * -------------------------------------------------------
   */
  const tempVectorA = new Vector3()
  const tempVectorB = new Vector3()
  const tempVectorC = new Vector3()

  const tempEulerA = new Euler()
  const tempEulerB = new Euler()
  const tempEulerC = new Euler()

  const tempQuaternionA = new Quaternion()
  const tempQuaternionB = new Quaternion()
  const tempQuaternionC = new Quaternion()
  /**
   * -------------------------------------------------------
   * TEMP VARIABLES END
   * -------------------------------------------------------
   */

  const getLocalRayOriginForWheel = (wheel: Wheel) => {
    const isFront = wheel === Wheel.FL || wheel === Wheel.FR
    const isLeft = wheel === Wheel.FL || wheel === Wheel.RL

    return {
      x: isFront ? wheelBase / 2 : -wheelBase / 2,
      y: -carBodyHeight / 2,
      z: isLeft ? carBodyWidth / 2 : -carBodyWidth / 2
    }
  }

  const getWorldRayOriginForWheel = (
    wheel: Wheel,
    carWorldPosition: RapierVector,
    carWorldRotation: RapierRotation
  ) => {
    const localRayOrigin = getLocalRayOriginForWheel(wheel)

    // calculate the world ray origin
    tempVectorA.set(localRayOrigin.x, localRayOrigin.y, localRayOrigin.z)
    tempVectorB.set(carWorldPosition.x, carWorldPosition.y, carWorldPosition.z)
    tempVectorA.applyQuaternion(
      tempQuaternionA.set(
        carWorldRotation.x,
        carWorldRotation.y,
        carWorldRotation.z,
        carWorldRotation.w
      )
    )
    tempVectorB.add(tempVectorA)

    return {
      x: tempVectorB.x,
      y: tempVectorB.y,
      z: tempVectorB.z
    }
  }

  const localPositionToWorld = (
    worldPosition: RapierVector,
    worldRotation: RapierRotation,
    localVector: RapierVector
  ) => {
    tempVectorA.set(localVector.x, localVector.y, localVector.z)
    tempVectorA.applyQuaternion(
      tempQuaternionA.set(worldRotation.x, worldRotation.y, worldRotation.z, worldRotation.w)
    )
    tempVectorB.set(worldPosition.x, worldPosition.y, worldPosition.z)
    tempVectorB.add(tempVectorA)

    return {
      x: tempVectorB.x,
      y: tempVectorB.y,
      z: tempVectorB.z
    }
  }

  const lengthOfRapierVector = (v: RapierVector) => {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  }

  /**
   * Returns the angle of a quaternion on a given axis.
   */
  const trueAxisAngle = (axis: 'z' | 'y' | 'x', quaternion: Quaternion) => {
    let direction = new Vector3(0, 0, 1)
    let origin = new Vector3(0, 0, 1)
    if (axis == 'z') {
      direction.set(1, 0, 0)
      origin.set(1, 0, 0)
    }
    direction.applyQuaternion(quaternion)

    direction.x = axis == 'x' ? 0 : direction.x
    direction.y = axis == 'y' ? 0 : direction.y
    direction.z = axis == 'z' ? 0 : direction.z

    direction.normalize()

    let angle = origin.angleTo(direction)

    if (axis == 'x' && direction.y > 0) angle = (360 * Math.PI) / 180 - angle
    if (axis == 'y' && direction.x < 0) angle = (360 * Math.PI) / 180 - angle
    if (axis == 'z' && direction.y < 0) angle = (360 * Math.PI) / 180 - angle

    return angle
  }

  const setFromRapierVector = (vector: RapierVector, threeVector: Vector3) => {
    return threeVector.set(vector.x, vector.y, vector.z)
  }

  const setFromRapierRotation = (rotation: Rotation, quaternion: Quaternion) => {
    return quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
  }

  const threeVectorToRapierVector = (threeVector: Vector3) => {
    return {
      x: threeVector.x,
      y: threeVector.y,
      z: threeVector.z
    }
  }

  const collideWithGroup = computeBitMask([0], [], [])

  useFrame((_, delta) => {
    if (!rigidBody || !collider || $paused) return

    // we're mostly working with 60fps, so correctedDelta is ~1
    const correctedDelta = delta * 60

    // get and set the basics
    const currentWorldPosition = rigidBody.translation()
    const currentWorldRotation = rigidBody.rotation()
    const linearVelocity = rigidBody.linvel()
    const velocity = length(linearVelocity)
    /**
     * Velocity from 0 to maxDesiredVelocity
     */
    const velocityNormalized = clamp(mapRange(velocity, 0, maxDesiredVelocity, 0, 1), 0, 1)

    setFromRapierVector(linearVelocity, tempVectorA)
    setFromRapierRotation(currentWorldRotation, tempQuaternionA)
    const isForward =
      tempVectorB.set(-1, 0, 0).applyQuaternion(tempQuaternionA).dot(tempVectorA) > 0

    /**
     * We're not setting dampings yet, we decide further down what the actual
     * value should be.
     */
    let finalAngularDamping = angularDamping
    let finalLinearDamping = linearDamping

    // update the inner group position and rotation
    updateCameraPosition: {
      if (!group || !dummyGroup || !innerGroup) break updateCameraPosition
      // cast a ray from the center of the car to the desired camera position
      group.quaternion.slerp(tempQuaternionA, 0.1)
      group.position.x = currentWorldPosition.x
      group.position.y = currentWorldPosition.y
      group.position.z = currentWorldPosition.z
      dummyGroup.getWorldPosition(tempVectorA)
      const origin = currentWorldPosition
      const direction = fromAToB(origin, tempVectorA)
      const rayLength = length(direction)
      const normalizedDirection = normalize(direction)
      const ray = new Ray(origin, normalizedDirection)
      const hit = world.castRay(
        ray,
        rayLength + cameraDistanceToWalls,
        true,
        undefined,
        collideWithGroup,
        collider,
        rigidBody
      )
      if (!hit) {
        innerGroup.position.copy(dummyGroup.position)
      } else {
        innerGroup.position
          .copy(dummyGroup.position)
          .normalize()
          .multiplyScalar(hit.toi - cameraDistanceToWalls)
      }
    }

    // convert the ray dir to world space
    const localRayDirection = { x: 0, y: -1, z: 0 }
    setFromRapierRotation(currentWorldRotation, tempQuaternionA)
    setFromRapierVector(localRayDirection, tempVectorA)
    tempVectorA.applyQuaternion(tempQuaternionA)
    const worldRayDirection = threeVectorToRapierVector(tempVectorA)

    Object.values(wheelStates).forEach((wheelState) => {
      const ray = new Ray(
        getWorldRayOriginForWheel(wheelState.type, currentWorldPosition, currentWorldRotation),
        worldRayDirection
      )

      wheelState.ray = ray
      const hit = world.castRayAndGetNormal(
        ray,
        maxGroundClearance,
        true,
        undefined,
        collideWithGroup,
        collider,
        rigidBody
      )

      if (hit && !hit.collider.isSensor()) {
        // wheel is touching the ground
        wheelState.onGround = true

        wheelState.surfaceImpactPoint = ray.pointAt(hit.toi)
        wheelState.surfaceImpactNormal = hit.normal

        /**
         * -----------------------------------------
         * SUSPENSION IMPULSE
         * -----------------------------------------
         */
        const suspensionForce =
          suspensionStiffness * (maxGroundClearance - hit.toi) +
          (suspensionDamping * (wheelState.suspensionLength - hit.toi)) / delta

        setFromRapierVector(ray.pointAt(1), tempVectorA)
        setFromRapierVector(ray.origin, tempVectorB)
        // the sub result vector is already normalized because of pointAt(1)
        tempVectorB
          .sub(tempVectorA)
          .multiplyScalar(suspensionForce)
          .multiplyScalar(suspensionImpulseMultiplier)

        rigidBody.applyImpulseAtPoint(
          { x: tempVectorB.x, y: tempVectorB.y, z: tempVectorB.z },
          ray.pointAt(hit.toi),
          true
        )

        wheelState.suspensionLength = hit.toi

        // update wheel group position
      } else {
        wheelState.onGround = false
      }

      // update wheel state
      if (wheelState.wheelGroup) {
        const localRayOriginPosition = getLocalRayOriginForWheel(wheelState.type)
        tempVectorA.set(
          localRayOriginPosition.x,
          localRayOriginPosition.y,
          localRayOriginPosition.z
        )
        tempVectorB.set(0, hit ? -hit.toi : -maxGroundClearance, 0)
        tempVectorA.add(tempVectorB)
        tempVectorA.y += wheelRadius
        wheelState.wheelGroup.position.copy(tempVectorA)
      }
    })

    /**
     * forward impulse, side impulse and steering torque is only applied when
     * the car is touching the ground!
     */
    if (Object.values(wheelStates).some((wheelState) => wheelState.onGround)) {
      /**
       * -----------------------------------------
       * FORWARD IMPULSE
       * -----------------------------------------
       */
      // use the direction of currentRotation to apply force

      const groundedWheels = Object.values(wheelStates).filter((wheelState) => wheelState.onGround)
      // calculate average surface normal
      const averageImpactSurfaceNormal = groundedWheels
        .reduce((acc, wheelState) => {
          acc.add(
            tempVectorA.set(
              wheelState.surfaceImpactNormal.x,
              wheelState.surfaceImpactNormal.y,
              wheelState.surfaceImpactNormal.z
            )
          )
          return acc
        }, new Vector3(0, 0, 0))
        .divideScalar(groundedWheels.length)

      let mode: 'accelerate' | 'brake' = 'accelerate'
      if (isForward && $axis.y > 0) mode = 'accelerate'
      else if (isForward && $axis.y < 0) mode = 'brake'
      else if (!isForward && $axis.y < 0) mode = 'accelerate'
      else if (!isForward && $axis.y > 0) mode = 'brake'

      const multiplier =
        mode === 'accelerate'
          ? isForward
            ? forwardImpulseMultiplier
            : backwardImpulseMultiplier
          : brakeImpulseMultiplier
      const map =
        mode === 'accelerate'
          ? isForward
            ? forwardImpulseMap
            : backwardImpulseMap
          : brakeImpulseMap

      carState.isBraking = mode === 'brake'

      const forwardImpulse = threeVectorToRapierVector(
        tempVectorA
          .set(-$axis.y * multiplier * map(velocityNormalized) * correctedDelta, 0, 0)
          .applyQuaternion(
            tempQuaternionA.set(
              currentWorldRotation.x,
              currentWorldRotation.y,
              currentWorldRotation.z,
              currentWorldRotation.w
            )
          )
          .projectOnPlane(averageImpactSurfaceNormal)
      )
      // const y = averageImpactSurfaceNormal.clone().normalize().y

      // the inclination is:
      // 0 when the car on a vertical surface going down
      // 0.5 when the car is on a flat surface
      // 1 when the car is on a vertical surface going up
      const inclination = mapLinear(
        setFromRapierVector(forwardImpulse, tempVectorA).normalize().y,
        -1,
        1,
        0,
        1
      )
      const finalImpulse = threeVectorToRapierVector(
        setFromRapierVector(forwardImpulse, tempVectorA).multiplyScalar(
          forwardImpulseInclinationMap(inclination)
        )
      )

      const forwardImpulseOrigin = localPositionToWorld(
        currentWorldPosition,
        currentWorldRotation,
        virtualCenterOfMass
      )
      rigidBody.applyImpulseAtPoint(finalImpulse, forwardImpulseOrigin, true)
      carState.forwardImpulse.direction = normalize(finalImpulse)
      carState.forwardImpulse.origin = forwardImpulseOrigin
      carState.forwardImpulse.length = lengthOfRapierVector(finalImpulse)

      /**
       * -----------------------------------------
       * STEERING TORQUE
       * -----------------------------------------
       */
      if (velocity > steeringVelocityThreshold) {
        // we're moving, so set the angular damping to the default
        finalAngularDamping = angularDamping

        // the side torque is a function of the velocity multiplied by the
        // steering input and a multiplier
        const steeringTorque =
          (isForward ? $axis.x : -$axis.x) *
          steeringTorqueMultiplier *
          correctedDelta *
          steeringMap(velocityNormalized)
        const steeringTorqueImpulse = averageImpactSurfaceNormal
          .clone()
          .normalize()
          .multiplyScalar(steeringTorque)
        rigidBody.applyTorqueImpulse(steeringTorqueImpulse, true)
        carState.steeringTorque.direction = normalize(steeringTorqueImpulse)
        carState.steeringTorque.origin = currentWorldPosition
        carState.steeringTorque.length = lengthOfRapierVector(steeringTorqueImpulse)
      } else {
        // if we're not moving, reset the angular velocity
        finalAngularDamping = angularDampingWhenBelowSteeringVelocityThreshold
      }

      /**
       * -----------------------------------------
       * SIDE IMPULSE
       * -----------------------------------------
       */
      // get side component of local frame velocity
      const currentVelocity = rigidBody.linvel()
      tempVectorA.set(currentVelocity.x, currentVelocity.y, currentVelocity.z)

      tempQuaternionA.set(
        currentWorldRotation.x,
        currentWorldRotation.y,
        currentWorldRotation.z,
        currentWorldRotation.w
      )

      const currentVelocityDot = tempVectorB
        .set(0, 0, -1)
        .applyQuaternion(tempQuaternionA)
        .dot(tempVectorA)

      const sideImpulseVector = tempVectorB
        .set(0, 0, 1)
        .applyQuaternion(tempQuaternionA)
        .multiplyScalar(currentVelocityDot * correctedDelta * sideImpulseMultiplier)

      const sideImpulse = {
        x: sideImpulseVector.x,
        y: 0,
        z: sideImpulseVector.z
      }
      const sideImpulseOrigin = localPositionToWorld(
        currentWorldPosition,
        currentWorldRotation,
        virtualCenterOfMass
      )

      rigidBody.applyImpulseAtPoint(sideImpulse, sideImpulseOrigin, true)
      carState.sideImpulse.direction = normalize(sideImpulse)
      carState.sideImpulse.origin = sideImpulseOrigin
      carState.sideImpulse.length = lengthOfRapierVector(sideImpulse)

      // we're on the ground, so set the linear damping to the default
      finalLinearDamping = linearDamping

      // set the playback rate according to the ground speed when we're touching the ground
      const desiredPlaybackRate = mapLinear(
        soundPlaybackMap(clamp(mapLinear(carState.velocity, 0, maxDesiredVelocity, 0, 1), 0, 1)),
        0,
        1,
        minPlaybackRate,
        maxPlaybackRate
      )
      // we're lerping toward desiredPlaybackRate
      playbackRate = lerp(playbackRate, desiredPlaybackRate, 0.4)
    } else {
      // if we're not touching the ground, the playback rate is adhering to the forward input
      const desiredPlaybackRate = mapLinear(
        soundPlaybackMap(Math.max($axis.y, 0)),
        0,
        1,
        minPlaybackRate,
        maxPlaybackRate
      )
      // we're lerping toward desiredPlaybackRate
      playbackRate = lerp(playbackRate, desiredPlaybackRate, 0.1)

      // we also set carState.isBraking based on the yAxis
      carState.isBraking = $axis.y < 0

      // if braking mid-air, the car can be stopped rotating and moving slightly
      if (carState.isBraking) {
        finalLinearDamping = linearDampingWhenBrakingInAir
        finalAngularDamping = angularDampingWhenBrakingInAir
      } else {
        // we're in the air, so set the dampings appropriately
        finalLinearDamping = linearDampingWhenInAir
        finalAngularDamping = angularDampingWhenInAir
      }
    }

    // even if we're airborn, we still set the steering angle
    // get the linear velocity of the car
    steeringAngle.set(
      (visualSteeringMap(velocityNormalized) * $axis.x * maxSteeringAngle * Math.PI) / 180
    )

    // the volume is set by the "forward" input
    const desiredVolume =
      mapLinear(Math.max($axis.y, 0), 0, 1, idleVolume, loadVolume) *
      mapLinear(playbackRate, minPlaybackRate, maxPlaybackRate, volumePlaybackRateMultiplier, 1)
    // we're lerping toward desiredVolume
    const volumeIsGoingUp = desiredVolume > volume
    const t = volumeIsGoingUp ? 0.4 : 0.05
    volume = lerp(volume, desiredVolume, t)

    // set the dampings
    rigidBody.setAngularDamping(finalAngularDamping)
    rigidBody.setLinearDamping(finalLinearDamping)

    carState.worldPosition.set(
      currentWorldPosition.x,
      currentWorldPosition.y,
      currentWorldPosition.z
    )

    carState.velocity = velocity

    // tell svelte to update stuff
    wheelStates = wheelStates
    carState = carState
  })

  // const audioLoader = useLoader(AudioLoader)
  // const audioBuffer = audioLoader.load('/assets/basic-vehicle-controller/engine5.wav')
  // const audioCtx = new AudioContext()
  // const source = audioCtx.createBufferSource()
  // source.connect(audioCtx.destination)

  // $: if ($audioBuffer && !$paused) {
  //   source.buffer = $audioBuffer
  //   ;(window as any).source = source
  //   source.loop = true
  //   source.start(0)
  // } else if ($paused) {
  //   source.stop()
  // }
  ;(window as any).someValue = 5
</script>

<svelte:window
  on:keypress={(e) => {
    const { key } = e
    if (key === 'Enter' && !$paused) {
      respawn()
    }
  }}
/>

{#if !$paused}
  <Audio
    src="/assets/basic-vehicle-controller/engine6.wav"
    loop
    autoplay
    {volume}
    {playbackRate}
  />
{/if}

<T.Group>
  <RigidBody
    canSleep={false}
    type="fixed"
    bind:rigidBody
  >
    <Collider
      restitution={0}
      friction={0.4}
      mass={carWeight}
      bind:collider
      shape="roundCuboid"
      args={[
        carBodyLength / 2 - carBodyRadius,
        carBodyHeight / 2 - carBodyRadius,
        carBodyWidth / 2 - carBodyRadius,
        carBodyRadius
      ]}
    >
      {#if !debug}
        <slot
          name="body"
          {carState}
        />
      {/if}

      {#if debug}
        <!-- Helper Arrows showing suspension rays -->
        {#each Object.values(wheelStates) as wheelState}
          {@const rayOrigin = getLocalRayOriginForWheel(wheelState.type)}
          {@const origin = new Vector3(rayOrigin.x, rayOrigin.y, rayOrigin.z)}
          {@const direction = new Vector3(0, -1, 0)}
          <T.ArrowHelper
            args={[direction, origin, wheelState.suspensionLength, 0xff0000, 0.05, 0.05]}
          />
          <Text
            rotation.y={(90 * Math.PI) / 180}
            position.x={wheelState.type === Wheel.FL || wheelState.type === Wheel.FR
              ? wheelBase / 2
              : -wheelBase / 2}
            position.z={wheelState.type === Wheel.FR || wheelState.type === Wheel.RR
              ? -carBodyWidth / 2
              : carBodyWidth / 2}
            position.y={0.2}
            fontSize={0.3}
            anchorX="50%"
            anchorY="50%"
            text={wheelState.suspensionLength.toFixed(2)}
          />
        {/each}

        <Text
          rotation.y={(90 * Math.PI) / 180}
          fontSize={0.3}
          anchorX="50%"
          anchorY="50%"
          text={carState.velocity.toFixed(2)}
        />
      {/if}

      <!-- WHEEL SLOTS -->
      <T.Group bind:ref={wheelStates.FL.wheelGroup}>
        <slot name="wheel-fl" />
      </T.Group>
      <T.Group
        bind:ref={wheelStates.FR.wheelGroup}
        rotation.y={(180 * Math.PI) / 180}
      >
        <slot name="wheel-fr" />
      </T.Group>
      <T.Group
        bind:ref={wheelStates.RL.wheelGroup}
        rotation.y={$steeringAngle}
      >
        <slot name="wheel-rl" />
      </T.Group>
      <T.Group
        bind:ref={wheelStates.RR.wheelGroup}
        rotation.y={$steeringAngle + (180 * Math.PI) / 180}
      >
        <slot name="wheel-rr" />
      </T.Group>
    </Collider>
  </RigidBody>

  <T.Group
    bind:ref={group}
    let:ref
  >
    <T.Group
      bind:ref={dummyGroup}
      position.x={desiredCameraDistance}
      position.y={desiredCameraHeight}
    />
    <T.Group bind:ref={innerGroup}>
      <slot
        name="camera"
        {ref}
      />
    </T.Group>
  </T.Group>
</T.Group>

{#if debug && Object.values(wheelStates).some((wheelState) => wheelState.onGround)}
  <T.ArrowHelper
    args={[
      carState.forwardImpulse.direction,
      carState.forwardImpulse.origin,
      carState.forwardImpulse.length / forwardImpulseMultiplier,
      0xff0000,
      0.05,
      0.05
    ]}
  />
  <T.ArrowHelper
    args={[
      carState.steeringTorque.direction,
      carState.steeringTorque.origin,
      carState.steeringTorque.length / steeringTorqueMultiplier,
      0x00ff00,
      0.05,
      0.05
    ]}
  />
  <T.ArrowHelper
    args={[
      carState.sideImpulse.direction,
      carState.sideImpulse.origin,
      carState.sideImpulse.length / sideImpulseMultiplier,
      0x0000ff,
      0.05,
      0.05
    ]}
  />
{/if}

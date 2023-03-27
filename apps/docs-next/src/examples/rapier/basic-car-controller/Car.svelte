<script lang="ts">
  import {
    Collider as RapierCollider,
    Ray,
    RigidBody as RapierRigidBody,
    Rotation as RapierRotation,
    Rotation,
    Vector as RapierVector
  } from '@dimforge/rapier3d-compat'
  import { T, useFrame, useLoader } from '@threlte/core'
  import { Text, useGltf } from '@threlte/extras'
  import { Collider, RigidBody, useRapier } from '@threlte/rapier'
  import { mapRange } from '@tweakpane/core'
  import { spring } from 'svelte/motion'
  import { Euler, Group, Quaternion, TextureLoader, Vector3 } from 'three'
  import { clamp } from 'three/src/math/MathUtils'
  import { length, normalize } from './vectorUtils'

  const { world } = useRapier()

  const model = useGltf('/assets/basic-vehicle-controller/muscle-car.glb')

  const map = useLoader(TextureLoader).load(
    '/assets/basic-vehicle-controller/prototype-textures/Green/texture_10.png'
  )

  let rigidBody: RapierRigidBody
  let collider: RapierCollider
  let group: Group

  const steeringAngle = spring(0)

  enum Wheel {
    'FL' = 'FL',
    'FR' = 'FR',
    'RL' = 'RL',
    'RR' = 'RR'
  }

  let debug = false

  type WheelState = {
    type: Wheel
    onGround: boolean
    suspensionLength: number
    ray: Ray
    surfaceImpactPoint: RapierVector
    surfaceImpactNormal: RapierVector
    wheelGroup: Group
  }

  type CarState = {
    isForward: boolean
    isBraking: boolean
    velocity: number
    lastPosition: Vector3
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

  /**
   * -------------------------------------------------------
   * CAR CONFIGURATION
   * -------------------------------------------------------
   */

  /**
   * In degrees
   */
  const maxSteeringAngle = 35

  const carWeight = 1500
  /**
   * In units/s
   */
  const maxDesiredVelocity = 75

  // spawn car from the air
  const spawnHeight = 1

  // const suspensionMountHeightRelativeToCarFloor = 0
  const suspensionStiffness = 0.5
  const suspensionDamping = 0.03

  // ~ VW Passat dimensions
  const carBodyHeight = 1.12
  const carBodyWidth = 1.9
  const carBodyLength = 4.5

  // 16 inch wheels have ~0.2m radius
  const wheelRadius = 0.306

  // racing cars have ~0.05m ground clearance
  const maxGroundClearance = 0.25

  // ~ VW Passat wheelbase
  const wheelBase = 2.56

  const suspensionImpulseMultiplier = 1600
  const forwardImpulseMultiplier = 800
  const forwardImpulseMap = (_t: number) => 1
  const brakeImpulseMultiplier = 2000
  const brakeImpulseMap = (_t: number) => 1
  const steeringTorqueMultiplier = 250
  const sideImpulseMultiplier = 140

  /**
   * Steering torque is only applied if the velocity is above this threshold.
   */
  const steeringVelocityThreshold = 0.3
  const steeringMap = (t: number) => {
    if (t < 0.0625) return ((0.4375 - 0) / (0.0625 - 0)) * (t - 0) + 0
    if (t < 0.25) return ((1 - 0.4375) / (0.25 - 0.0625)) * (t - 0.0625) + 0.4375
    return ((0.25 - 1) / (1 - 0.25)) * (t - 0.25) + 1
  }
  const visualSteeringMap = (t: number) => {
    if (t < 0.3125) return ((1 - 0.875) / (0.3125 - 0)) * (t - 0) + 0.875
    return ((0.3125 - 1) / (1 - 0.3125)) * (t - 0.3125) + 1
  }

  const angularDamping = 4
  const angularDampingWhenBelowSteeringVelocityThreshold = 40
  const angularDampingWhenInAir = 2

  const linearDamping = 0.3
  const linearDampingWhenInAir = 0.1

  const virtualCenterOfMass = new Vector3(0.15, -0.25, 0)
  /**
   * -------------------------------------------------------
   * CAR CONFIGURATION END
   * -------------------------------------------------------
   */

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

  const carState: CarState = {
    isForward: false,
    isBraking: false,
    lastPosition: new Vector3(),
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

  let xAxis = 0
  let yAxis = 0

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

  useFrame((_, delta) => {
    if (!rigidBody || !collider) return

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
    if (group) {
      group.position.x = currentWorldPosition.x
      group.position.y = currentWorldPosition.y
      group.position.z = currentWorldPosition.z
      setFromRapierRotation(currentWorldRotation, tempQuaternionA)
      group.rotation.y = trueAxisAngle('y', tempQuaternionA)
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
        undefined,
        collider,
        rigidBody
      )

      if (hit) {
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

      ;(window as any).asfi = averageImpactSurfaceNormal.toArray()

      let mode: 'accelerate' | 'brake' = 'accelerate'
      if (isForward && yAxis < 0) mode = 'accelerate'
      else if (isForward && yAxis > 0) mode = 'brake'
      else if (!isForward && yAxis > 0) mode = 'accelerate'
      else if (!isForward && yAxis < 0) mode = 'brake'

      const multiplier = mode === 'accelerate' ? forwardImpulseMultiplier : brakeImpulseMultiplier
      const map = mode === 'accelerate' ? forwardImpulseMap : brakeImpulseMap

      ;(window as any).mode = mode
      ;(window as any).yAxis = yAxis

      const forwardImpulse = threeVectorToRapierVector(
        tempVectorA
          .set(yAxis * multiplier * map(velocityNormalized), 0, 0)
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
      const forwardImpulseOrigin = localPositionToWorld(
        currentWorldPosition,
        currentWorldRotation,
        virtualCenterOfMass
      )
      rigidBody.applyImpulseAtPoint(forwardImpulse, forwardImpulseOrigin, true)
      carState.forwardImpulse.direction = normalize(forwardImpulse)
      ;(window as any).fi = `${forwardImpulse.x}, ${forwardImpulse.y}, ${forwardImpulse.z}`
      carState.forwardImpulse.origin = forwardImpulseOrigin
      carState.forwardImpulse.length = lengthOfRapierVector(forwardImpulse)

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
          (isForward ? xAxis : -xAxis) * steeringTorqueMultiplier * steeringMap(velocityNormalized)
        const steeringTorqueImpulse = { x: 0, y: steeringTorque, z: 0 }
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
        .multiplyScalar(currentVelocityDot)
        .multiplyScalar(sideImpulseMultiplier)

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
    } else {
      // we're in the air, so set the dampings appropriately
      finalLinearDamping = linearDampingWhenInAir
      finalAngularDamping = angularDampingWhenInAir
    }

    // even if we're airborn, we still set the steering angle
    // get the linear velocity of the car
    steeringAngle.set(
      (visualSteeringMap(velocityNormalized) * xAxis * maxSteeringAngle * Math.PI) / 180
    )

    // set the dampings
    rigidBody.setAngularDamping(finalAngularDamping)
    rigidBody.setLinearDamping(finalLinearDamping)

    carState.lastPosition.set(
      currentWorldPosition.x,
      currentWorldPosition.y,
      currentWorldPosition.z
    )

    carState.velocity = velocity

    // tell svelte to update stuff
    wheelStates = wheelStates
  })
</script>

<svelte:window
  on:keypress={({ key }) => {
    if (key === 'o') {
      debug = !debug
    }
  }}
  on:keydown={({ key }) => {
    if (key === 'w') {
      yAxis = -1
    } else if (key === 's') {
      yAxis = 1
    } else if (key === 'a') {
      xAxis = 1
    } else if (key === 'd') {
      xAxis = -1
    }
  }}
  on:keyup={({ key }) => {
    if (key === 'w' || key === 's') {
      yAxis = 0
    } else if (key === 'a' || key === 'd') {
      xAxis = 0
    }
  }}
/>

<T.Group position.y={carBodyHeight / 2 + maxGroundClearance + spawnHeight}>
  <RigidBody
    canSleep={false}
    type="dynamic"
    bind:rigidBody
  >
    <Collider
      mass={carWeight}
      bind:collider
      shape="cuboid"
      args={[carBodyLength / 2, carBodyHeight / 2, carBodyWidth / 2]}
    >
      {#if $model}
        <T
          rotation.y={(-90 * Math.PI) / 180}
          is={$model.scene}
          scale={1}
        />
      {/if}

      <!-- <T.Mesh position.y={-carBodyHeight / 4}>
        <T.BoxGeometry args={[carBodyLength, carBodyHeight / 2, carBodyWidth]} />
        {#if $map}
          <T.MeshStandardMaterial
            map={$map}
            transparent
            opacity={0.6}
          />
        {/if}
      </T.Mesh>

      <T.Mesh position.y={carBodyHeight / 4}>
        <T.BoxGeometry args={[carBodyLength / 2, carBodyHeight / 2, (carBodyWidth * 4) / 5]} />
        {#if $map}
          <T.MeshStandardMaterial
            map={$map}
            transparent
            opacity={0.6}
          />
        {/if}
      </T.Mesh> -->

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
    <slot {ref} />
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

<script lang="ts">
  import {
    Collider as RapierCollider,
    Ray,
    RigidBody as RapierRigidBody,
    Rotation as RapierRotation,
    Vector as RapierVector
  } from '@dimforge/rapier3d-compat'
  import { T, useFrame, useLoader } from '@threlte/core'
  import { HTML } from '@threlte/extras'
  import { Collider, RigidBody, useRapier } from '@threlte/rapier'
  import { mapRange } from '@tweakpane/core'
  import { spring } from 'svelte/motion'
  import { Euler, Group, Quaternion, TextureLoader, Vector3 } from 'three'
  import { clamp } from 'three/src/math/MathUtils'

  const { world } = useRapier()

  const map = useLoader(TextureLoader).load(
    '/assets/basic-vehicle-controller/prototype-textures/Green/texture_10.png'
  )

  let rigidBody: RapierRigidBody
  let collider: RapierCollider
  let group: Group

  enum Wheel {
    'FL' = 'FL',
    'FR' = 'FR',
    'RL' = 'RL',
    'RR' = 'RR'
  }

  type WheelState = {
    type: Wheel
    onGround: boolean
    suspensionLength: number
    ray: Ray
  }

  type CarState = {
    lastPosition: Vector3
    /**
     * in radians
     */
    steeringAngle: number
  }

  /**
   * -------------------------------------------------------
   * CAR CONFIGURATION
   * -------------------------------------------------------
   */

  const carWeight = 1500
  /**
   * In units/s
   */
  const maxDesiredVelocity = 45

  // spawn car from the air
  const spawnHeight = 0.1

  // const suspensionMountHeightRelativeToCarFloor = 0
  const suspensionStiffness = 0.85
  const suspensionDamping = 0.05

  // ~ VW Passat dimensions
  const carBodyHeight = 1.5
  const carBodyWidth = 1.8
  const carBodyLength = 4.5

  // 16 inch wheels have ~0.2m radius
  const wheelRadius = 0.2

  // racing cars have ~0.05m ground clearance
  const groundClearanceWhenCompressed = 0.05
  const groundClearanceWhenExtended = 0.2
  const maxGroundClearance = 0.3

  // ~ VW Passat wheelbase
  const wheelBase = 2.7

  const suspensionForceMultiplier = 800
  const forwardForceMultiplier = 400
  const sideTorqueMultiplier = 200
  const sidewaysForceMultiplier = 100

  /**
   * Steering torque is only applied if the velocity is above this threshold.
   */
  const steeringVelocityThreshold = 0.3
  const steeringMap = (t: number) => {
    if (t < 0.25) return ((1 - 0) / (0.25 - 0)) * (t - 0) + 0
    return ((0.25 - 1) / (1 - 0.25)) * (t - 0.25) + 1
  }

  const angularDamping = 3
  const angularDampingWhenBelowSteeringVelocityThreshold = 40
  const angularDampingWhenInAir = 2

  const linearDamping = 0.3
  const linearDampingWhenInAir = 0.1

  const virtualCenterOfMass = new Vector3(-0.1, -0.4, 0)

  /**
   * -------------------------------------------------------
   * CAR CONFIGURATION END
   * -------------------------------------------------------
   */

  // the total length of the suspension travel
  const suspensionTravel = maxGroundClearance
  // const suspensionLengthExtended =
  //   suspensionMountHeightRelativeToCarFloor + groundClearanceWhenExtended
  // const suspensionLengthCompressed =
  //   suspensionMountHeightRelativeToCarFloor - groundClearanceWhenCompressed

  const defaultRay = new Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 })

  let wheelStates: Record<Wheel, WheelState> = {
    FL: {
      type: Wheel.FL,
      onGround: false,
      suspensionLength: maxGroundClearance,
      ray: defaultRay
    },
    FR: {
      type: Wheel.FR,
      onGround: false,
      suspensionLength: maxGroundClearance,
      ray: defaultRay
    },
    RL: {
      type: Wheel.RL,
      onGround: false,
      suspensionLength: maxGroundClearance,
      ray: defaultRay
    },
    RR: {
      type: Wheel.RR,
      onGround: false,
      suspensionLength: maxGroundClearance,
      ray: defaultRay
    }
  }

  const carState: CarState = {
    lastPosition: new Vector3(),
    steeringAngle: 0
  }

  const steeringAngle = spring(0)
  $: steeringAngle.set((xAxis * 35 * Math.PI) / 180)

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

  const getRayOriginForWheel = (
    wheel: Wheel,
    carWorldPosition: RapierVector,
    carWorldRotation: RapierRotation
  ) => {
    const isFront = wheel === Wheel.FL || wheel === Wheel.FR
    const isLeft = wheel === Wheel.FL || wheel === Wheel.RL

    const localRayOrigin = {
      x: isFront ? wheelBase / 2 : -wheelBase / 2,
      y: -carBodyHeight / 2,
      z: isLeft ? carBodyWidth / 2 : -carBodyWidth / 2
    }

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

  const rapierVectorToThreeVector = (vector: RapierVector, threeVector: Vector3) => {
    threeVector.set(vector.x, vector.y, vector.z)
  }

  useFrame((_, delta) => {
    if (!rigidBody || !collider) return

    const currentWorldPosition = rigidBody.translation()
    const currentWorldRotation = rigidBody.rotation()

    let finalAngularDamping = angularDamping
    let finalLinearDamping = linearDamping

    // update the inner group position and rotation
    if (group) {
      group.position.x = currentWorldPosition.x
      group.position.y = currentWorldPosition.y
      group.position.z = currentWorldPosition.z
      tempQuaternionA.set(
        currentWorldRotation.x,
        currentWorldRotation.y,
        currentWorldRotation.z,
        currentWorldRotation.w
      )
      group.rotation.y = trueAxisAngle('y', tempQuaternionA)
    }

    // convert the ray dir to world space
    const localRayDirection = { x: 0, y: -1, z: 0 }
    tempQuaternionA.set(
      currentWorldRotation.x,
      currentWorldRotation.y,
      currentWorldRotation.z,
      currentWorldRotation.w
    )
    tempVectorA.set(localRayDirection.x, localRayDirection.y, localRayDirection.z)
    tempVectorA.applyQuaternion(tempQuaternionA)
    const worldRayDirection = {
      x: tempVectorA.x,
      y: tempVectorA.y,
      z: tempVectorA.z
    }

    Object.values(wheelStates).forEach((wheelState) => {
      const ray = new Ray(
        getRayOriginForWheel(wheelState.type, currentWorldPosition, currentWorldRotation),
        worldRayDirection
      )
      wheelState.ray = ray
      const hit = world.castRayAndGetNormal(
        ray,
        suspensionTravel,
        true,
        undefined,
        undefined,
        collider,
        rigidBody
      )

      if (hit) {
        // wheel is touching the ground
        wheelState.onGround = true

        /**
         * -----------------------------------------
         * SUSPENSION IMPULSE
         * -----------------------------------------
         */
        const suspensionForce =
          suspensionStiffness * (suspensionTravel - hit.toi) +
          (suspensionDamping * (wheelState.suspensionLength - hit.toi)) / delta

        rapierVectorToThreeVector(ray.pointAt(1), tempVectorA)
        rapierVectorToThreeVector(ray.origin, tempVectorB)
        // the result vector is already normalized
        tempVectorB
          .sub(tempVectorA)
          .multiplyScalar(suspensionForce)
          .multiplyScalar(suspensionForceMultiplier)

        rigidBody.applyImpulseAtPoint(
          { x: tempVectorB.x, y: tempVectorB.y, z: tempVectorB.z },
          ray.pointAt(hit.toi),
          true
        )

        // update wheel state
        wheelState.suspensionLength = hit.toi
      } else {
        wheelState.onGround = false
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
      const quat = tempQuaternionA.set(
        currentWorldRotation.x,
        currentWorldRotation.y,
        currentWorldRotation.z,
        currentWorldRotation.w
      )
      tempVectorA.set(1 * yAxis * forwardForceMultiplier, 0, 0).applyQuaternion(quat)

      rigidBody.applyImpulseAtPoint(
        {
          x: tempVectorA.x,
          y: 0,
          z: tempVectorA.z
        },
        localPositionToWorld(currentWorldPosition, currentWorldRotation, virtualCenterOfMass),
        true
      )

      /**
       * -----------------------------------------
       * STEERING TORQUE
       * -----------------------------------------
       */
      // get the linear velocity of the car
      const linearVelocity = rigidBody.linvel()
      tempVectorA.set(linearVelocity.x, linearVelocity.y, linearVelocity.z)
      // get the velocity of the car as a number
      const velocity = tempVectorA.length()
      // if the velocity is greater than the threshold, apply torque
      if (velocity > steeringVelocityThreshold) {
        // we're moving, so set the angular damping to the default
        finalAngularDamping = angularDamping

        // we need to figure out if we're moving forward or backward
        // to do this, we'll get the dot product of the velocity and the
        // forward vector of the car
        // if the dot product is positive, we're moving forward
        // if the dot product is negative, we're moving backward
        // if the dot product is 0, we're not moving
        const currentVelocity = rigidBody.linvel()
        tempVectorA.set(currentVelocity.x, currentVelocity.y, currentVelocity.z)

        tempQuaternionA.set(
          currentWorldRotation.x,
          currentWorldRotation.y,
          currentWorldRotation.z,
          currentWorldRotation.w
        )

        const isForward =
          tempVectorB.set(-1, 0, 0).applyQuaternion(tempQuaternionA).dot(tempVectorA) > 0

        // the side torque is a function of the velocity multiplied by the
        // steering input and a multiplier
        const sideTorque =
          (isForward ? xAxis : -xAxis) *
          sideTorqueMultiplier *
          steeringMap(clamp(mapRange(velocity, 0, maxDesiredVelocity, 0, 1), 0, 1))
        rigidBody.applyTorqueImpulse({ x: 0, y: sideTorque, z: 0 }, true)
      } else {
        // if we're not moving, reset the angular velocity
        finalAngularDamping = angularDampingWhenBelowSteeringVelocityThreshold
      }

      /**
       * -----------------------------------------
       * SIDEWAYS IMPULSE
       * -----------------------------------------
       */
      // get sideways component of local frame velocity
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

      const sidewaysImpulse = tempVectorB
        .set(0, 0, 1)
        .applyQuaternion(tempQuaternionA)
        .multiplyScalar(currentVelocityDot)
        .multiplyScalar(sidewaysForceMultiplier)

      rigidBody.applyImpulseAtPoint(
        {
          x: sidewaysImpulse.x,
          y: 0,
          z: sidewaysImpulse.z
        },
        localPositionToWorld(currentWorldPosition, currentWorldRotation, virtualCenterOfMass),
        true
      )

      // we're on the ground, so set the linear damping to the default
      finalLinearDamping = linearDamping
    } else {
      // we're in the air, so set the dampings appropriately
      finalLinearDamping = linearDampingWhenInAir
      finalAngularDamping = angularDampingWhenInAir
    }

    // set the dampings
    rigidBody.setAngularDamping(finalAngularDamping)
    rigidBody.setLinearDamping(finalLinearDamping)

    carState.lastPosition.set(
      currentWorldPosition.x,
      currentWorldPosition.y,
      currentWorldPosition.z
    )

    // tell svelte to update stuff
    wheelStates = wheelStates
  })
</script>

<svelte:window
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

<T.Group position.y={carBodyHeight / 2 + groundClearanceWhenExtended + spawnHeight}>
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
      <!-- <T.Mesh position.y={-carBodyHeight / 4}>
        <T.BoxGeometry args={[carBodyLength, carBodyHeight / 2, carBodyWidth]} />
        {#if $map}
          <T.MeshStandardMaterial map={$map} />
        {/if}
      </T.Mesh>

      <T.Mesh position.y={carBodyHeight / 4}>
        <T.BoxGeometry args={[carBodyLength / 2, carBodyHeight / 2, (carBodyWidth * 4) / 5]} />
        {#if $map}
          <T.MeshStandardMaterial map={$map} />
        {/if}
      </T.Mesh> -->
    </Collider>
  </RigidBody>

  <T.Group bind:ref={group}>
    <slot />
  </T.Group>
</T.Group>

{#each Object.values(wheelStates) as wheelState}
  {@const origin = new Vector3(
    wheelState.ray.origin.x,
    wheelState.ray.origin.y,
    wheelState.ray.origin.z
  )}
  {@const direction = new Vector3(wheelState.ray.dir.x, wheelState.ray.dir.y, wheelState.ray.dir.z)}
  <T.ArrowHelper args={[direction, origin, wheelState.suspensionLength, 0xff0000, 0.05, 0.05]} />
  <HTML position={origin.toArray()}>
    <div class="-translate-x-1/2 -translate-y-1/2">
      {wheelState.suspensionLength.toFixed(2)}
    </div>
  </HTML>
{/each}

<script lang="ts">
  import {
    Collider as RapierCollider,
    Ray,
    RigidBody as RapierRigidBody,
    Rotation as RapierRotation,
    Vector as RapierVector
  } from '@dimforge/rapier3d-compat'
  import { T, useFrame } from '@threlte/core'
  import { Collider, CollisionGroups, RigidBody, useRapier } from '@threlte/rapier'
  import { Euler, Group, Quaternion, Vector3 } from 'three'

  const { world } = useRapier()

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
  }

  type CarState = {
    lastPosition: Vector3
  }

  /**
   * -------------------------------------------------------
   * CAR CONFIGURATION
   * -------------------------------------------------------
   */

  const carWeight = 1500

  // spawn car from the air
  const spawnHeight = 0.1

  const suspensionMountHeightRelativeToCarFloor = 0.6
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

  // ~ VW Passat wheelbase
  const wheelBase = 2.7

  const suspensionForceMultiplier = 1000
  const forwardForceMultiplier = 50
  const sideTorqueMultiplier = 50

  /**
   * -------------------------------------------------------
   * CAR CONFIGURATION END
   * -------------------------------------------------------
   */

  // the total length of the suspension travel
  const suspensionTravel = groundClearanceWhenExtended - groundClearanceWhenCompressed
  const suspensionLengthExtended =
    suspensionMountHeightRelativeToCarFloor + groundClearanceWhenExtended
  const suspensionLengthCompressed =
    suspensionMountHeightRelativeToCarFloor - groundClearanceWhenCompressed

  const wheelStates: Record<Wheel, WheelState> = {
    FL: {
      type: Wheel.FL,
      onGround: false,
      suspensionLength: suspensionLengthExtended
    },
    FR: {
      type: Wheel.FR,
      onGround: false,
      suspensionLength: suspensionLengthExtended
    },
    RL: {
      type: Wheel.RL,
      onGround: false,
      suspensionLength: suspensionLengthExtended
    },
    RR: {
      type: Wheel.RR,
      onGround: false,
      suspensionLength: suspensionLengthExtended
    }
  }

  const carState: CarState = {
    lastPosition: new Vector3()
  }

  // temp vectors
  const tempVectorA = new Vector3()
  const tempVectorB = new Vector3()
  const tempVectorC = new Vector3()

  // temp eulers
  const tempEulerA = new Euler()
  const tempEulerB = new Euler()
  const tempEulerC = new Euler()

  // temp quaternion
  const tempQuaternionA = new Quaternion()
  const tempQuaternionB = new Quaternion()
  const tempQuaternionC = new Quaternion()

  const getRayOrigin = (
    wheel: Wheel,
    carWorldPosition: RapierVector,
    carWorldRotation: RapierRotation
  ) => {
    const isFront = wheel === Wheel.FL || wheel === Wheel.FR
    const isLeft = wheel === Wheel.FL || wheel === Wheel.RL

    const localRayOrigin = {
      x: isFront ? wheelBase / 2 : -wheelBase / 2,
      y: -carBodyHeight / 2 + suspensionMountHeightRelativeToCarFloor,
      z: (isLeft ? carBodyWidth / 2 : -carBodyWidth / 2) + (isLeft ? 0.05 : -0.05)
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

    if (wheel === Wheel.FL) {
    }

    return {
      x: tempVectorB.x,
      y: tempVectorB.y,
      z: tempVectorB.z
    }
  }

  const getWheelOnGroundVector = (
    wheel: Wheel,
    carCenter: RapierVector,
    carRotation: RapierRotation,
    suspensionLength: number
  ) => {
    const origin = getRayOrigin(wheel, carCenter, carRotation)
    origin.y =
      carCenter.y - carBodyHeight / 2 + suspensionMountHeightRelativeToCarFloor + suspensionLength
    if (wheel === Wheel.FL) {
    }
    return origin
  }

  let xAxis = 0
  let yAxis = 0

  let innerGroupPosition = {
    x: 0,
    y: 0,
    z: 0
  }

  useFrame((_, delta) => {
    if (!rigidBody || !collider) return

    const now = performance.now()

    const currentTranslation = rigidBody.translation()
    const currentRotation = rigidBody.rotation()

    // update the inner group position and rotation
    if (group) {
      group.position.x = currentTranslation.x
      group.position.y = currentTranslation.y
      group.position.z = currentTranslation.z
      tempEulerA.setFromQuaternion(
        tempQuaternionA.set(
          currentRotation.x,
          currentRotation.y,
          currentRotation.z,
          currentRotation.w
        )
      )
      group.rotation.x = tempEulerA.x
      group.rotation.y = tempEulerA.y
      group.rotation.z = tempEulerA.z
    }

    tempVectorA
      .set(0, -1, 0)
      .applyQuaternion(
        tempQuaternionA.set(
          currentRotation.x,
          currentRotation.y,
          currentRotation.z,
          currentRotation.w
        )
      )
    const rayDir = {
      x: tempVectorA.x,
      y: tempVectorA.y,
      z: tempVectorA.z
    }

    Object.values(wheelStates).forEach((wheelState) => {
      const ray = new Ray(
        getRayOrigin(wheelState.type, currentTranslation, currentRotation),
        rayDir
      )
      const hit = world.castRayAndGetNormal(
        ray,
        suspensionLengthExtended,
        true,
        undefined,
        undefined,
        collider,
        rigidBody
      )
      if (wheelState.type === Wheel.FL) {
      }

      if (hit) {
        // save surfaceImpactPoint
        const surfaceImpactPoint = ray.pointAt(hit.toi)
        // save surfaceImpactNormal
        const surfaceImpactNormal = hit.normal

        // wheel is touching the ground
        wheelState.onGround = true

        // suspension force
        const suspensionForce =
          suspensionStiffness * (suspensionLengthExtended - hit.toi) +
          (suspensionDamping * (wheelState.suspensionLength - hit.toi)) / delta

        const wheelOnGroundVector = getWheelOnGroundVector(
          wheelState.type,
          currentTranslation,
          currentRotation,
          hit.toi
        )

        rigidBody.applyImpulseAtPoint(
          { x: 0, y: suspensionForce * suspensionForceMultiplier, z: 0 },
          wheelOnGroundVector,
          true
        )

        // forward force
        // use the direction of currentRotation to apply force
        const quat = tempQuaternionA.set(
          currentRotation.x,
          currentRotation.y,
          currentRotation.z,
          currentRotation.w
        )
        tempVectorA.set(1 * yAxis * forwardForceMultiplier, 0, 0).applyQuaternion(quat)

        rigidBody.applyImpulseAtPoint(
          {
            x: tempVectorA.x,
            y: 0,
            z: tempVectorA.z
          },
          {
            x: currentTranslation.x,
            y: currentTranslation.y - 0.3,
            z: currentTranslation.z
          },
          true
        )

        // update wheel state
        wheelState.suspensionLength = hit.toi

        // steering torque
        const sideTorque = xAxis * sideTorqueMultiplier
        rigidBody.applyTorqueImpulse({ x: 0, y: sideTorque, z: 0 }, true)

        // side impulse
        // get sideways component of current frame velocity
        const currentVelocity = rigidBody.linvel()
        const currentVelocityVector = new Vector3(
          currentVelocity.x,
          currentVelocity.y,
          currentVelocity.z
        )
        const currentVelocityVectorNormalized = currentVelocityVector.normalize()
        const currentVelocityVectorNormalizedDot = currentVelocityVectorNormalized.dot(
          new Vector3(1, 0, 0)
        )
        ;(window as any).dot = currentVelocityVector
      } else {
        wheelState.onGround = false
      }
    })

    carState.lastPosition.set(currentTranslation.x, currentTranslation.y, currentTranslation.z)

    const elapsed = performance.now() - now
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

<CollisionGroups groups={[15]}>
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
        <T.Mesh position.y={-carBodyHeight / 4}>
          <T.BoxGeometry args={[carBodyLength, carBodyHeight / 2, carBodyWidth]} />
          <T.MeshStandardMaterial color="red" />
        </T.Mesh>

        <T.Mesh position.y={carBodyHeight / 4}>
          <T.BoxGeometry args={[carBodyLength / 2, carBodyHeight / 2, (carBodyWidth * 4) / 5]} />
          <T.MeshStandardMaterial color="red" />
        </T.Mesh>
      </Collider>
    </RigidBody>

    <T.Group
      bind:ref={group}
      position.x={innerGroupPosition.x}
      position.y={innerGroupPosition.y}
      position.z={innerGroupPosition.z}
    >
      <slot />
    </T.Group>
  </T.Group>
</CollisionGroups>

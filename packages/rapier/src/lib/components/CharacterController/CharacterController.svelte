<script lang="ts">
  import type {
    Collider as RapierCollider,
    RigidBody as RapierRigidBody
  } from '@dimforge/rapier3d-compat'
  import { useFrame, type Position } from '@threlte/core'
  import { onDestroy } from 'svelte'
  import { Collider, RigidBody } from '../..'
  import { useRapier } from '../../hooks/useRapier'

  const { world } = useRapier()

  let rigidBody: RapierRigidBody | undefined = undefined
  let collider: RapierCollider | undefined = undefined
  export let spawn: Position = {}
  let spawned = false
  export let width = 0.4
  export let height = 1.6
  export let offset = 0.1
  export let gravity: Position = { x: 0, y: -0.981, z: 0 }
  export let move: Position = { x: 0, y: 0, z: 0 }

  const characterController = world.createCharacterController(offset)
  characterController.enableAutostep(0.3, 0.05, false)
  onDestroy(() => {
    world.removeCharacterController(characterController)
  })

  let lastPosY = 0
  useFrame(() => {
    if (!rigidBody || !collider) return
    if (!spawned) {
      rigidBody.setTranslation({ x: spawn.x ?? 0, y: spawn.y ?? 0, z: spawn.z ?? 0 }, true)
      lastPosY = spawn.y ?? 0
      spawned = true
      return
    }
    const currentPos = rigidBody.translation()
    const currentPosY = currentPos.y
    const diff = currentPosY - lastPosY
    const gravityAppliedDiff = diff + (gravity?.y ?? 0) * world.timestep
    lastPosY = currentPos.y

    const m = { x: move?.x ?? 0, y: (move?.y ?? 0) + gravityAppliedDiff, z: move?.z ?? 0 }

    characterController.computeColliderMovement(collider, m)

    const correctedMovement = characterController.computedMovement()

    correctedMovement.x /= world.timestep
    correctedMovement.y /= world.timestep
    correctedMovement.z /= world.timestep
    rigidBody.setLinvel(correctedMovement, true)
  })
</script>

<RigidBody
  type="kinematicVelocity"
  bind:rigidBody
>
  <Collider
    bind:collider
    shape="capsule"
    args={[(height - width) / 2, width / 2]}
  >
    <slot />
  </Collider>
</RigidBody>

<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls, Environment, Portal } from '@threlte/extras'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import Car from './Car.svelte'
  import Level from './Level/Level.svelte'
  import MuscleCar from './MuscleCar.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'
  import type { CarState } from './types'

  let carState: CarState

  const { scene } = useThrelte()
</script>

<Environment
  path="/hdr/"
  files="shanghai_riverside_1k.hdr"
/>

{#if carState}
  <T.DirectionalLight
    intensity={0.4}
    position.x={carState.worldPosition.x + 8}
    position.y={carState.worldPosition.y + 20}
    position.z={carState.worldPosition.z - 3}
    castShadow
    let:ref
  >
    <Portal object={scene}>
      <T
        is={ref.target}
        position.x={carState.worldPosition.x}
        position.y={carState.worldPosition.y}
        position.z={carState.worldPosition.z}
      />
    </Portal>
  </T.DirectionalLight>
{/if}

<Level />

<Car bind:carState>
  <T.PerspectiveCamera
    slot="camera"
    rotation={[-90 * DEG2RAD, 70 * DEG2RAD, 90 * DEG2RAD]}
    position.x={8}
    position.y={3}
    fov={70}
    makeDefault
  />

  <svelte:fragment
    slot="body"
    let:carState
  >
    <MuscleCar
      isBraking={carState.isBraking}
      rotation.y={(-90 * Math.PI) / 180}
    />
  </svelte:fragment>

  <MuscleCarWheel
    rotation.y={(90 * Math.PI) / 180}
    slot="wheel-fl"
  />
  <MuscleCarWheel
    rotation.y={(90 * Math.PI) / 180}
    slot="wheel-fr"
  />
  <MuscleCarWheel
    rotation.y={(90 * Math.PI) / 180}
    slot="wheel-rl"
  />
  <MuscleCarWheel
    rotation.y={(90 * Math.PI) / 180}
    slot="wheel-rr"
  />
</Car>

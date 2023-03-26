<script lang="ts">
  import { T } from '@threlte/core'
  import { Environment, OrbitControls } from '@threlte/extras'
  import { useRapier } from '@threlte/rapier'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import Car from './Car.svelte'
  import Level from './Level/Level.svelte'

  const { world } = useRapier()
  world.maxStabilizationIterations = 10
  world.maxVelocityIterations = 10
  world.maxVelocityFrictionIterations = 16
</script>

<Environment
  path="/hdr/"
  files="shanghai_riverside_1k.hdr"
/>

<T.DirectionalLight
  intensity={0.4}
  position={[8, 20, -3]}
/>

<Level />

<Car
  position.x={5}
  position.y={5}
>
  <T.PerspectiveCamera
    rotation={[-90 * DEG2RAD, 70 * DEG2RAD, 90 * DEG2RAD]}
    position.x={10}
    position.y={5}
    fov={60}
    makeDefault
  >
    <!-- <OrbitControls /> -->
  </T.PerspectiveCamera>
</Car>

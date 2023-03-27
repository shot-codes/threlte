<script lang="ts">
  import { T } from '@threlte/core'
  import { useRapier } from '@threlte/rapier'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import Car from './Car.svelte'
  import Level from './Level/Level.svelte'
</script>

<T.DirectionalLight
  intensity={0.4}
  position={[8, 20, -3]}
/>

<T.AmbientLight
  intensity={0.2}
  position={[8, 20, -3]}
/>

<Level />

<Car>
  <T.PerspectiveCamera
    rotation={[-90 * DEG2RAD, 70 * DEG2RAD, 90 * DEG2RAD]}
    position.x={10}
    position.y={5}
    fov={60}
    makeDefault
  />
</Car>

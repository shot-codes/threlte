<script lang="ts">
  import { T } from '@threlte/core'
  import { OrbitControls, Environment } from '@threlte/extras'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import Car from './Car.svelte'
  import Level from './Level/Level.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'
</script>

<Environment
  path="/hdr/"
  files="shanghai_riverside_1k.hdr"
/>

<T.DirectionalLight
  intensity={0.4}
  position={[8, 20, -3]}
/>

<!-- <T.AmbientLight
  intensity={0.2}
  position={[8, 20, -3]}
/> -->

<Level />

<Car>
  <T.PerspectiveCamera
    rotation={[-90 * DEG2RAD, 70 * DEG2RAD, 90 * DEG2RAD]}
    position.x={8}
    position.y={3}
    fov={70}
    makeDefault
  >
    <OrbitControls />
  </T.PerspectiveCamera>

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
  <!-- <T.Mesh
    slot="wheel-fl"
    rotation.x={(-90 * Math.PI) / 180}
  >
    <T.CylinderGeometry args={[0.306, 0.306, 0.2, 32]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
  <T.Mesh
    slot="wheel-fr"
    rotation.x={(-90 * Math.PI) / 180}
  >
    <T.CylinderGeometry args={[0.306, 0.306, 0.2, 32]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
  <T.Mesh
    slot="wheel-rl"
    rotation.x={(-90 * Math.PI) / 180}
  >
    <T.CylinderGeometry args={[0.306, 0.306, 0.2, 32]} />
    <T.MeshStandardMaterial />
  </T.Mesh>
  <T.Mesh
    slot="wheel-rr"
    rotation.x={(-90 * Math.PI) / 180}
  >
    <T.CylinderGeometry args={[0.306, 0.306, 0.2, 32]} />
    <T.MeshStandardMaterial />
  </T.Mesh> -->
</Car>

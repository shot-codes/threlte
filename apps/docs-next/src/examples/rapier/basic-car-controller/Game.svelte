<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { Portal } from '@threlte/extras'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import Car from './Car.svelte'
  import Level from './Level/Level.svelte'
  import MuscleCar from './MuscleCar.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'
  import { debug } from './stores/app'

  let levelId = 'a-1'

  const { scene } = useThrelte()
</script>

<Level
  {levelId}
  canEdit={true}
>
  <Car debug={$debug}>
    <T.PerspectiveCamera
      slot="camera"
      rotation={[-90 * DEG2RAD, 75 * DEG2RAD, 90 * DEG2RAD]}
      fov={70}
      makeDefault
    />

    <svelte:fragment
      slot="body"
      let:carState
    >
      <T.Group rotation.y={(-90 * Math.PI) / 180}>
        <MuscleCar isBraking={carState.isBraking} />
      </T.Group>
    </svelte:fragment>

    <T.Group
      rotation.y={(90 * Math.PI) / 180}
      slot="wheel-fl"
    >
      <MuscleCarWheel />
    </T.Group>

    <T.Group
      rotation.y={(90 * Math.PI) / 180}
      slot="wheel-fr"
    >
      <MuscleCarWheel />
    </T.Group>

    <T.Group
      rotation.y={(90 * Math.PI) / 180}
      slot="wheel-rl"
    >
      <MuscleCarWheel />
    </T.Group>

    <T.Group
      rotation.y={(90 * Math.PI) / 180}
      slot="wheel-rr"
    >
      <MuscleCarWheel />
    </T.Group>

    <svelte:fragment let:carState>
      <T.DirectionalLight
        intensity={0.4}
        position.x={carState.worldPosition.x + 8}
        position.y={carState.worldPosition.y + 20}
        position.z={carState.worldPosition.z - 3}
        shadow.camera.left={-10}
        shadow.camera.right={10}
        shadow.camera.top={10}
        shadow.camera.bottom={-10}
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
    </svelte:fragment>
  </Car>
</Level>

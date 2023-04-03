<script lang="ts">
  import { T } from '@threlte/core'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import Car from './Car.svelte'
  import Level from './Level/Level.svelte'
  import MuscleCar from './MuscleCar.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'
  import { debug } from './stores/app'

  let levelId = 'a-1'
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
  </Car>
</Level>

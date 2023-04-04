<script lang="ts">
  import { T, useFrame } from '@threlte/core'
  import { Environment } from '@threlte/extras'
  import { createEventDispatcher, onMount } from 'svelte'
  import { tweened } from 'svelte/motion'
  import type { PerspectiveCamera } from 'three'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import MuscleCar from './MuscleCar.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'

  let camera: PerspectiveCamera

  const dispatch = createEventDispatcher<{
    introdone: void
  }>()

  let rotationY = 0

  useFrame(() => {
    rotationY += 0.001
  })

  const fov = tweened(10, {
    duration: 30e3
  })
  const lookAt = tweened([-1, 0.7, 0] as [number, number, number], {
    duration: 30e3
  })
  onMount(() => {
    fov.set(20)
    lookAt.set([0, 0.7, 0])
  })

  const wheelBase = 2.56
  const width = 1.9
  const height = -0.4

  $: if (camera) {
    camera.lookAt(...$lookAt)
  }
</script>

<svelte:window
  on:keypress={(e) => {
    const { key } = e
    if (key === 'Enter') {
      dispatch('introdone')
    }
  }}
/>

<T.Group position.y={0.7}>
  <MuscleCar />

  <T.Group position.y={height}>
    <!-- FRONT WHEELS -->
    <T.Group position.z={wheelBase / 2}>
      <!-- FRONT LEFT WHEEL -->
      <T.Group
        position.x={width / 2}
        rotation.z={180 * DEG2RAD}
      >
        <MuscleCarWheel />
      </T.Group>

      <!-- FRONT RIGHT WHEEL -->
      <T.Group position.x={-width / 2}>
        <MuscleCarWheel />
      </T.Group>
    </T.Group>

    <!-- BACK WHEELS -->
    <T.Group position.z={-wheelBase / 2}>
      <!-- BACK LEFT WHEEL -->
      <T.Group
        position.x={width / 2}
        rotation.z={180 * DEG2RAD}
      >
        <MuscleCarWheel />
      </T.Group>

      <!-- BACK RIGHT WHEEL -->
      <T.Group position.x={-width / 2}>
        <MuscleCarWheel />
      </T.Group>
    </T.Group>
  </T.Group>
</T.Group>

<Environment
  path="/hdr/"
  files="shanghai_riverside_1k.hdr"
/>

<T.DirectionalLight
  position={[5, 5, 5]}
  intensity={1}
  castShadow
/>

<T.Group rotation.y={rotationY}>
  <T.PerspectiveCamera
    bind:ref={camera}
    fov={$fov}
    makeDefault
    position={[10, 1.7, 10]}
  />
</T.Group>

<!-- <ContactShadows color="#393939" /> -->

<T.Mesh
  receiveShadow
  rotation.x={-90 * DEG2RAD}
>
  <T.PlaneGeometry args={[5, 5]} />
  <T.ShadowMaterial />
</T.Mesh>

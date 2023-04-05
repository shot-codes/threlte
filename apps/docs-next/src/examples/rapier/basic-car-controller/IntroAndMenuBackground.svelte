<script lang="ts">
  import { T, useFrame, useThrelte } from '@threlte/core'
  import { Float, OrbitControls } from '@threlte/extras'
  import { onMount } from 'svelte'
  import { cubicInOut, quadOut, sineOut } from 'svelte/easing'
  import { tweened } from 'svelte/motion'
  import type { PerspectiveCamera } from 'three'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import CameraFade from './CameraFade.svelte'
  import HalfBox from './Level/Elements/HalfBox.svelte'
  import MuscleCar from './MuscleCar.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'

  let camera: PerspectiveCamera

  const rotationY = tweened(0, {
    duration: 30e3,
    easing: sineOut
  })

  const cameraPosY = tweened(0.7, {
    duration: 30e3,
    easing: sineOut
  })

  const fade = tweened(1, {
    duration: 3e3,
    easing: cubicInOut
  })

  let wheelRotation = 0
  useFrame(() => {
    wheelRotation += 1
  })

  const fov = tweened(7, {
    duration: 30e3,
    easing: sineOut
  })
  const lookAt = tweened([0, 0.7, 2] as [number, number, number], {
    duration: 30e3,
    easing: quadOut
  })
  onMount(() => {
    // wait for things to settle down
    setTimeout(() => {
      fov.set(20)
      lookAt.set([0, 0.7, 0])
      rotationY.set(1.3)
      cameraPosY.set(1.7)
      fade.set(0)
    }, 1e3)
  })

  const wheelBase = 2.56
  const width = 1.9
  const height = -0.4

  $: if (camera) {
    camera.lookAt(...$lookAt)
  }

  let offset = 0

  const boxComponents = [HalfBox]
  const boxLength = 5
  const trackElements = 20
  const trackLength = trackElements * boxLength
  const elementComponents = new Array(trackElements).fill(0).map(() => {
    const index = Math.floor(Math.random() * boxComponents.length)
    return boxComponents[index]
  })
  const initialPositions = new Array(trackElements).fill(0).map((_, index) => {
    return index * boxLength - trackLength
  })

  let absolutePositions = [...initialPositions]
  let currentPositions = [...initialPositions]

  let speed = 0.5

  useFrame(() => {
    offset += speed
    absolutePositions = initialPositions.map((initialPosition) => {
      return initialPosition - offset
    })
    currentPositions = absolutePositions.map((absolutePosition) => {
      return (absolutePosition % trackLength) + trackLength / 2
    })
  })

  const { scene } = useThrelte()
</script>

<T.Fog
  near={20}
  far={45}
  color="#A7AABA"
  on:create={({ ref, cleanup }) => {
    scene.fog = ref
    cleanup(() => {
      scene.fog = null
    })
  }}
/>

{#each elementComponents as element, index (index)}
  <T.Group
    position.z={currentPositions[index]}
    scale={0.5}
  >
    <svelte:component this={element} />
  </T.Group>
{/each}

<T.Group position.y={0.7}>
  <MuscleCar />

  <T.Group position.y={height}>
    <!-- FRONT WHEELS -->
    <T.Group position.z={wheelBase / 2}>
      <!-- FRONT LEFT WHEEL -->
      <T.Group
        position.x={width / 2}
        rotation.z={180 * DEG2RAD}
        rotation.x={-wheelRotation}
      >
        <MuscleCarWheel />
      </T.Group>

      <!-- FRONT RIGHT WHEEL -->
      <T.Group
        position.x={-width / 2}
        rotation.x={-wheelRotation}
      >
        <MuscleCarWheel />
      </T.Group>
    </T.Group>

    <!-- BACK WHEELS -->
    <T.Group position.z={-wheelBase / 2}>
      <!-- BACK LEFT WHEEL -->
      <T.Group
        position.x={width / 2}
        rotation.z={180 * DEG2RAD}
        rotation.x={-wheelRotation}
      >
        <MuscleCarWheel />
      </T.Group>

      <!-- BACK RIGHT WHEEL -->
      <T.Group
        position.x={-width / 2}
        rotation.x={-wheelRotation}
      >
        <MuscleCarWheel />
      </T.Group>
    </T.Group>
  </T.Group>
</T.Group>

<T.DirectionalLight
  position={[5, 5, 5]}
  intensity={1}
  castShadow
/>

<T.Group rotation.y={$rotationY}>
  <Float
    floatIntensity={1}
    speed={3}
  >
    <T.PerspectiveCamera
      makeDefault
      bind:ref={camera}
      fov={$fov}
      position={[-10, $cameraPosY, 10]}
    >
      <CameraFade
        opacity={$fade}
        color="black"
      />
    </T.PerspectiveCamera>
  </Float>
</T.Group>

<T.PerspectiveCamera position={[10, 10, 10]}>
  <OrbitControls />
</T.PerspectiveCamera>

<script lang="ts">
  import { T, useFrame, useRender, useThrelte } from '@threlte/core'
  import { AudioListener, Environment, interactivity, OrbitControls, Portal } from '@threlte/extras'
  import { useRapier } from '@threlte/rapier'
  import { useTheatre } from '@threlte/theatre'
  import Stats from 'stats.js'
  import { tick } from 'svelte'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import Car from './Car.svelte'
  import Game from './Game.svelte'
  import MuscleCar from './MuscleCar.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'
  import { debug } from './stores/app'
  import type { CarState } from './types'

  let carState: CarState

  const { scene } = useThrelte()
  const { pause, resume } = useRapier()
  const { studio } = useTheatre()

  let isPaused = false
  $: isPaused ? pause() : resume()

  let edit = false
  $: edit ? $studio?.ui.restore() : $studio?.ui.hide()

  interactivity()

  const stats = new Stats()
  stats.showPanel(1) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)
  stats.dom.style.top = 'unset'
  stats.dom.style.bottom = '0'

  useFrame(
    () => {
      stats.begin()
    },
    {
      order: -Infinity
    }
  )

  useRender(async (ctx) => {
    await tick()
    ctx.renderer?.render(ctx.scene, ctx.camera.current)
    stats.end()
  })
</script>

<svelte:window
  on:keypress={(e) => {
    if (e.key === 'e') {
      edit = !edit
    }
    if (e.key === 'p') {
      isPaused = !isPaused
    }
  }}
/>

<AudioListener />

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
{/if}

<Game />

<T.PerspectiveCamera
  position.x={30}
  position.y={30}
  position.z={30}
  fov={70}
  makeDefault={edit}
>
  <OrbitControls />
</T.PerspectiveCamera>

<Car
  bind:carState
  debug={$debug}
>
  <T.PerspectiveCamera
    slot="camera"
    rotation={[-90 * DEG2RAD, 75 * DEG2RAD, 90 * DEG2RAD]}
    fov={70}
    makeDefault={!edit}
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

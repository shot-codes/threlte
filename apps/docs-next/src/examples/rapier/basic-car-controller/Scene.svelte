<script lang="ts">
  import { T, useFrame, useRender, useThrelte } from '@threlte/core'
  import { AudioListener, OrbitControls, Portal } from '@threlte/extras'
  import { useRapier } from '@threlte/rapier'
  import Stats from 'stats.js'
  import { tick } from 'svelte'
  import Game from './Game.svelte'
  import { paused } from './stores/app'
  import type { CarState } from './types'

  let carState: CarState

  const { scene } = useThrelte()
  const { pause, resume } = useRapier()

  $: $paused ? pause() : resume()

  let edit = false

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
    if (e.key === 'p') {
      paused.update((value) => {
        return !value
      })
    }
  }}
/>

<!-- We're only using global audio, so a global Audio Listener is fine -->
<AudioListener />

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

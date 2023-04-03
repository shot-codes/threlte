<script lang="ts">
  import { T, useFrame, useRender } from '@threlte/core'
  import { AudioListener, OrbitControls } from '@threlte/extras'
  import { useRapier } from '@threlte/rapier'
  import Stats from 'stats.js'
  import { tick } from 'svelte'
  import Game from './Game.svelte'
  import { paused } from './stores/app'

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

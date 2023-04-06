<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { Debug, World } from '@threlte/rapier'
  import Loader from './Loader.svelte'
  import Scene from './Scene.svelte'
  import {
    appState,
    actions,
    printState,
    saveStateToLocalStorage,
    loadStateFromLocalStorage
  } from './stores/app'
  import { useKeyPress } from './useKeyPress'

  const { debug } = appState

  useKeyPress('o', () => {
    actions.toggleDebug()
  })

  const onVisibilityChange = () => {
    if (document.hidden || document.visibilityState === 'hidden') {
      actions.setVisibility('hidden')
    } else {
      actions.setVisibility('visible')
    }
  }

  useKeyPress('Shift+P', () => {
    printState()
  })

  useKeyPress('Shift+I', (e) => {
    e.preventDefault()
    saveStateToLocalStorage()
  })

  useKeyPress('Shift+K', (e) => {
    e.preventDefault()
    loadStateFromLocalStorage()
  })
</script>

<svelte:window on:visibilitychange={onVisibilityChange} />

<div class="w-full h-full relative bg-black">
  <Canvas
    rendererParameters={{
      powerPreference: 'high-performance',
      alpha: true
    }}
  >
    <World order={-999}>
      {#if $debug}
        <Debug
          depthTest={false}
          depthWrite={false}
        />
      {/if}

      <Loader>
        <Scene />
      </Loader>
    </World>
  </Canvas>

  <div
    class="absolute top-0 left-0 w-full h-full  z-10 text-[3vh] [&_button]:pointer-events-auto p-[15px] pointer-events-none"
    id="car-ui-portal-target"
  />
</div>

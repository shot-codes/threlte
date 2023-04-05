<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { Debug, World } from '@threlte/rapier'
  import Loader from './Loader.svelte'
  import Scene from './Scene.svelte'
  import { appState, actions } from './stores/flow'
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
</script>

<svelte:window on:visibilitychange={onVisibilityChange} />

<div class="w-full h-full relative">
  <Canvas>
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
    class="absolute top-0 left-0 w-full h-full pointer-events-none z-10 text-[3vh] [&_button]:pointer-events-auto"
    id="car-ui-portal-target"
  />
</div>

<style>
  p {
    font-size: 0.75rem;
    line-height: 1rem;
  }
</style>

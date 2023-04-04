<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { Debug, World } from '@threlte/rapier'
  import Loader from './Loader.svelte'
  import Scene from './Scene.svelte'
  import { debug, paused } from './stores/app'

  const onVisibilityChange = () => {
    if (document.hidden) {
      paused.set(true)
    } else {
      paused.set(false)
    }
  }
</script>

<svelte:window
  on:visibilitychange={onVisibilityChange}
  on:keypress={({ key }) => {
    if (key === 'o') {
      debug.update((value) => {
        return !value
      })
    }
  }}
/>

<div class="w-full h-full">
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
</div>

<style>
  p {
    font-size: 0.75rem;
    line-height: 1rem;
  }
</style>

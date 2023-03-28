<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { Debug, World } from '@threlte/rapier'
  import { Theatre } from '@threlte/theatre'
  import Scene from './Scene.svelte'

  let debug = false
</script>

<svelte:window
  on:keypress={({ key }) => {
    if (key === 'o') {
      debug = !debug
    }
  }}
/>

<div class="w-full h-full">
  <Canvas>
    <Theatre>
      <World order={-999}>
        {#if debug}
          <Debug
            depthTest={false}
            depthWrite={false}
          />
        {/if}
        <Scene />
      </World>
    </Theatre>
  </Canvas>
</div>

<style>
  p {
    font-size: 0.75rem;
    line-height: 1rem;
  }
</style>

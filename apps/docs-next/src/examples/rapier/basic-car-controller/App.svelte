<script lang="ts">
  import { useTweakpane } from '../../utils/useTweakpane'
  import { Canvas } from '@threlte/core'
  import { HTML } from '@threlte/extras'
  import { Debug, World } from '@threlte/rapier'
  import Scene from './Scene.svelte'

  const { action, pane } = useTweakpane()

  pane.addBlade({
    view: 'text',
    text: "Use the 'wasd' keys to drive",
    lineCount: 3
  })

  let debug = false
</script>

<svelte:window
  on:keypress={({ key }) => {
    if (key === 'o') {
      debug = !debug
    }
  }}
/>

<div use:action />

<Canvas>
  <World>
    {#if debug}
      <Debug
        depthTest={false}
        depthWrite={false}
      />
    {/if}

    <Scene />

    <HTML
      slot="fallback"
      transform
    >
      <p>
        It seems your browser<br />
        doesn't support WASM.<br />
        I'm sorry.
      </p>
    </HTML>
  </World>
</Canvas>

<style>
  p {
    font-size: 0.75rem;
    line-height: 1rem;
  }
</style>

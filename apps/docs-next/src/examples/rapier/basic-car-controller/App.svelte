<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { Debug, World } from '@threlte/rapier'
  import { useTweakpane } from '../../utils/useTweakpane'
  import Scene from './Scene.svelte'

  const { action, pane } = useTweakpane()

  pane.addBlade({
    view: 'text',
    text: "Use the 'wasd' keys to drive",
    lineCount: 3
  })
  pane.addBlade({
    view: 'text',
    text: "Press 'r' to reset the car",
    lineCount: 3
  })
  pane.addBlade({
    view: 'text',
    text: "Press 'o' to toggle debug mode",
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
  </World>
</Canvas>

<style>
  p {
    font-size: 0.75rem;
    line-height: 1rem;
  }
</style>

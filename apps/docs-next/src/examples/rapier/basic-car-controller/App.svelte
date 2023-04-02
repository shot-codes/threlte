<script lang="ts">
  import { Canvas, T } from '@threlte/core'
  import { Audio, AudioListener, Environment, useProgress } from '@threlte/extras'
  import { Debug, World } from '@threlte/rapier'
  import BasicBox from './Level/Elements/BasicBox.svelte'
  import Checkpoint from './Level/Elements/Checkpoint.svelte'
  import CheckpointRing from './Level/Elements/CheckpointRing.svelte'
  import Finish from './Level/Elements/Finish.svelte'
  import HalfBox from './Level/Elements/HalfBox.svelte'
  import Ramp from './Level/Elements/Ramp.svelte'
  import RampInverse from './Level/Elements/RampInverse.svelte'
  import MuscleCar from './MuscleCar.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'
  import Scene from './Scene.svelte'
  import { debug } from './stores/app'

  const { finishedOnce } = useProgress()
  $: console.log($finishedOnce)
</script>

<svelte:window
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
      {#if !$finishedOnce}
        <AudioListener masterVolume={0} />

        <T.Group visible={false}>
          <!-- Add gltf components that need preloading here -->
          <!-- Envs -->
          <Environment
            path="/hdr/"
            files="shanghai_riverside_1k.hdr"
          />

          <!-- Car -->
          <MuscleCar />
          <MuscleCarWheel />

          <!-- Elements -->
          <BasicBox />
          <Checkpoint />
          <CheckpointRing />
          <Finish />
          <HalfBox />
          <Ramp />
          <RampInverse />

          <!-- Audios -->
          <Audio src="/assets/basic-vehicle-controller/engine6.wav" />
        </T.Group>
      {:else}
        <!-- <Theatre> -->
        {#if $debug}
          <Debug
            depthTest={false}
            depthWrite={false}
          />
        {/if}
        <Scene />
        <!-- </Theatre> -->
      {/if}
    </World>
  </Canvas>
</div>

<style>
  p {
    font-size: 0.75rem;
    line-height: 1rem;
  }
</style>

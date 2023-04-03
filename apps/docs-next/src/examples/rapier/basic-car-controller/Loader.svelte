<script lang="ts">
  import { preloadCheckpoint } from './Level/Elements/Checkpoint.svelte'
  import { preloadHalfbox } from './Level/Elements/HalfBox.svelte'
  import { preloadRamp } from './Level/Elements/Ramp.svelte'
  import { preloadRampInverse } from './Level/Elements/RampInverse.svelte'
  import { preloadMuscleCar } from './MuscleCar.svelte'
  import { preloadMuscleCarWheel } from './MuscleCarWheel.svelte'

  const preload = () => {
    return Promise.all([
      preloadMuscleCar(),
      preloadMuscleCarWheel(),
      preloadCheckpoint(),
      preloadHalfbox(),
      preloadRamp(),
      preloadRampInverse()
    ])
  }
</script>

{#await preload()}
  <!-- Loading indicator -->
{:then}
  <slot />
{/await}

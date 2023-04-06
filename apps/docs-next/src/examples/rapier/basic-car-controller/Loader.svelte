<script lang="ts">
  import { useProgress } from '@threlte/extras'
  import { preloadEnv } from './Env.svelte'
  import { preloadBarrier } from './Level/Elements/Barrier.svelte'
  import { preloadBarrierEnd } from './Level/Elements/BarrierEnd.svelte'
  import { preloadBarrierTurnLeft } from './Level/Elements/BarrierTurnLeft.svelte'
  import { preloadBarrierTurnRight } from './Level/Elements/BarrierTurnRight.svelte'
  import { preloadBasicBox } from './Level/Elements/BasicBox.svelte'
  import { preloadBoost } from './Level/Elements/Boost.svelte'
  import { preloadCheckpoint } from './Level/Elements/Checkpoint.svelte'
  import { preloadDoubleBarrier } from './Level/Elements/DoubleBarrier.svelte'
  import { preloadHalfbox } from './Level/Elements/HalfBox.svelte'
  import { preloadRamp } from './Level/Elements/Ramp.svelte'
  import { preloadRampInverse } from './Level/Elements/RampInverse.svelte'
  import { preloadSlope } from './Level/Elements/Slope.svelte'
  import { preloadMuscleCar } from './MuscleCar.svelte'
  import { preloadMuscleCarWheel } from './MuscleCarWheel.svelte'
  import LoadingUi from './UI/LoadingUi.svelte'

  const preload = () => {
    return Promise.all([
      preloadMuscleCar(),
      preloadMuscleCarWheel(),
      preloadCheckpoint(),
      preloadHalfbox(),
      preloadRamp(),
      preloadRampInverse(),
      preloadDoubleBarrier(),
      preloadBarrierEnd(),
      preloadBoost(),
      preloadBarrierTurnLeft(),
      preloadBarrierTurnRight(),
      preloadBarrier(),
      preloadSlope(),
      preloadEnv(),
      preloadBasicBox()
    ])
  }

  const { progress } = useProgress()
</script>

{#await preload()}
  <LoadingUi progress={$progress} />
{:then}
  <slot />
{/await}

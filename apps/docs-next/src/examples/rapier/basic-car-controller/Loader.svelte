<script lang="ts">
  import { useCache } from '@threlte/core'
  import { preloadBarrier } from './Level/Elements/Barrier.svelte'
  import { preloadBarrierEnd } from './Level/Elements/BarrierEnd.svelte'
  import { preloadBarrierTurnLeft } from './Level/Elements/BarrierTurnLeft.svelte'
  import { preloadBarrierTurnRight } from './Level/Elements/BarrierTurnRight.svelte'
  import { preloadBoost } from './Level/Elements/Boost.svelte'
  import { preloadCheckpoint } from './Level/Elements/Checkpoint.svelte'
  import { preloadDoubleBarrier } from './Level/Elements/DoubleBarrier.svelte'
  import { preloadHalfbox } from './Level/Elements/HalfBox.svelte'
  import { preloadRamp } from './Level/Elements/Ramp.svelte'
  import { preloadRampInverse } from './Level/Elements/RampInverse.svelte'
  import { preloadSlope } from './Level/Elements/Slope.svelte'
  import { preloadMuscleCar } from './MuscleCar.svelte'
  import { preloadMuscleCarWheel } from './MuscleCarWheel.svelte'
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
  import { preloadBasicBox } from './Level/Elements/BasicBox.svelte'

  const { remember } = useCache()

  const preloadEnv = async () => {
    const path = '/hdr/'
    const files = 'shanghai_riverside_1k.hdr'
    const cacheKey = [RGBELoader, path, files]
    await remember(async () => {
      const loader = new RGBELoader()
      return new Promise((resolve) => {
        loader.setPath(path).load(files, (texture: any) => {
          resolve(texture)
        })
      })
    }, cacheKey)
  }

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
</script>

{#await preload()}
  <!-- Loading indicator -->
{:then}
  <slot />
{/await}

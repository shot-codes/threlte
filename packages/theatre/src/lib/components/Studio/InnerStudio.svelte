<script lang="ts">
  import type { IStudio } from '@theatre/studio'
  import { onDestroy, onMount } from 'svelte'
  import { globalStudio } from '../consts'
  import { useStudio } from './useStudio'

  export let studio: IStudio | undefined = undefined
  export let hide: boolean

  const studioCtx = useStudio()

  let initialized = false

  onMount(async () => {
    if ($globalStudio) {
      $globalStudio.ui.restore()
      studioCtx.studio.set($globalStudio)
      return
    }
    const pkg = await import('@theatre/studio')
    const Studio = pkg.default
    Studio.initialize()
    globalStudio.set(Studio)
    studioCtx.studio.set(Studio)
    studio = Studio
    initialized = true
  })

  onDestroy(() => {
    $globalStudio?.ui.hide()
  })
</script>

{#if initialized}
  <slot />
{/if}

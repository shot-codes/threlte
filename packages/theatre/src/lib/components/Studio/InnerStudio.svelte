<script lang="ts">
  import type { IStudio } from '@theatre/studio'
  import { onDestroy, onMount } from 'svelte'
  import { globalStudio } from '../consts'
  import { useStudio } from './useStudio'

  export let studio: IStudio | undefined = undefined

  const studioCtx = useStudio()

  onMount(async () => {
    if ($globalStudio) {
      $globalStudio.ui.restore()
      studioCtx.set($globalStudio)
      return
    }
    const pkg = await import('@theatre/studio')
    const Studio = pkg.default
    Studio.initialize()
    globalStudio.set(Studio)
    studioCtx.set(Studio)
    studio = Studio
  })

  onDestroy(() => {
    $globalStudio?.ui.hide()
  })
</script>

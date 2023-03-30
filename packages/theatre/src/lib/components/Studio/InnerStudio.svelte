<script lang="ts">
  import { globalStudio } from '../consts'
  import { onDestroy, onMount } from 'svelte'
  import { useTheatre } from '../../hooks/useTheatre'

  const { studio: useTheatreStudio } = useTheatre()

  onMount(async () => {
    if ($globalStudio) {
      $globalStudio.ui.restore()
      useTheatreStudio.set($globalStudio)
      return
    }
    const pkg = await import('@theatre/studio')
    const Studio = pkg.default
    Studio.initialize()
    globalStudio.set(Studio)
    useTheatreStudio.set(Studio)
  })

  onDestroy(() => {
    $globalStudio?.ui.hide()
  })
</script>

<script lang="ts">
  import { globalStudio } from '../consts'
  import { onDestroy, onMount } from 'svelte'
  import { useTheatre } from '../../hooks/useTheatre'
  import Studio from '@theatre/studio'

  const { studio: useTheatreStudio } = useTheatre()

  onMount(async () => {
    if ($globalStudio) {
      $globalStudio.ui.restore()
      useTheatreStudio.set($globalStudio)
      return
    }
    Studio.initialize()
    globalStudio.set(Studio)
    useTheatreStudio.set(Studio)
  })

  onDestroy(() => {
    $globalStudio?.ui.hide()
  })
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher<{
    levelloaded: void
  }>()

  onMount(() => {
    dispatch('levelloaded')
  })
</script>

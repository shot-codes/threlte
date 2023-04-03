<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let checkpointCount: number
  export let finishCount: number

  $: if (finishCount < 1) console.warn('No finish found')

  const dispatch = createEventDispatcher<{
    levelcomplete: void
  }>()

  const checkpointsReached = new Set<string>()
  let levelComplete = false

  const registerCheckpointReached = (checkpointId: string) => {
    console.log('Checkpoint reached:', checkpointId)
    checkpointsReached.add(checkpointId)
  }

  const registerFinishReached = (finishId: string) => {
    console.log('Finish passed:', finishId)
    if (checkpointsReached.size === checkpointCount) {
      dispatch('levelcomplete')
      levelComplete = true
    }
  }
</script>

<slot
  {registerCheckpointReached}
  {registerFinishReached}
  {levelComplete}
/>

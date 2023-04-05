<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import UiWrapper from './UI/UiWrapper.svelte'

  const dispatch = createEventDispatcher<{
    countindone: void
  }>()

  const wait = (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  let currentCount = 3
  const count = async () => {
    for (let index = 0; index < 3; index++) {
      await wait(500)
      currentCount--
      if (currentCount === 0) {
        dispatch('countindone')
      }
    }
  }

  onMount(() => {
    count()
  })
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-[33vh] tracking-widest">
    <div>{currentCount}</div>
  </div>
</UiWrapper>

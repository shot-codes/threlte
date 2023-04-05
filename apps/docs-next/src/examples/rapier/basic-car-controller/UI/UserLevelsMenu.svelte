<script lang="ts">
  import { actions } from '../stores/app'
  import { useKeyDown } from '../useKeyDown'
  import UiWrapper from './UiWrapper.svelte'

  useKeyDown('Escape', () => {
    actions.goToMainMenu()
  })
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-[33vh] tracking-widest">
    <button
      on:click={() => {
        actions.startLevelEditor('some-id')
      }}
    >
      Create Level
    </button>
  </div>
</UiWrapper>

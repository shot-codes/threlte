<script lang="ts">
  import { actions } from '../stores/app'
  import { getters } from '../stores/getters'
  import UiWrapper from './UiWrapper.svelte'

  const { formattedTime } = getters.timeAttack
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-[33vh] tracking-widest">
    <div>
      {$formattedTime}
    </div>
    <button
      on:click={() => {
        actions.goToMainMenu()
      }}
    >
      Main Menu
    </button>
    <button
      on:click={() => {
        actions.resetTimeAttack()
      }}
    >
      Restart
    </button>
  </div>
</UiWrapper>

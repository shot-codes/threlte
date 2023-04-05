<script lang="ts">
  import { actions } from '../stores/flow'
  import UiWrapper from './UiWrapper.svelte'
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-[33vh] tracking-widest">
    <button
      on:click={() => {
        actions.goToMainMenu()
      }}>Menu</button
    >
  </div>
</UiWrapper>

<script lang="ts">
  import { actions } from '../stores/app'
  import UiWrapper from './UiWrapper.svelte'
  import Button from './components/Button.svelte'
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-full tracking-widest gap-4">
    <div class="">THRELTEMANIA</div>

    <Button
      on:click={() => {
        actions.goToCampaignMenu()
      }}
    >
      Campaign
    </Button>

    <Button
      on:click={() => {
        actions.goToUserLevelsMenu()
      }}
    >
      User Levels
    </Button>
  </div>
</UiWrapper>

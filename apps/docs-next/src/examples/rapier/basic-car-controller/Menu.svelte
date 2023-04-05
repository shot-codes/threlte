<script lang="ts">
  import { menuState } from './stores/flow'
  import CampaignMenu from './UI/CampaignMenu.svelte'
  import MainMenu from './UI/MainMenu.svelte'

  const { state } = menuState
</script>

{#if $state === 'campaign'}
  <CampaignMenu />
{:else if $state === 'main'}
  <MainMenu />
{/if}

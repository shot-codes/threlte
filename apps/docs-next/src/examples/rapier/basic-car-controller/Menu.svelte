<script lang="ts">
  import { menuState } from './stores/app'
  import CampaignMenu from './UI/CampaignMenu.svelte'
  import MainMenu from './UI/MainMenu.svelte'
  import UserLevelsMenu from './UI/UserLevelsMenu.svelte'

  const { state } = menuState
</script>

{#if $state === 'campaign'}
  <CampaignMenu />
{:else if $state === 'main'}
  <MainMenu />
{:else if $state === 'user-levels'}
  <UserLevelsMenu />
{/if}

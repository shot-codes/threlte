<script lang="ts">
  import { actions } from '../stores/flow'
  import UiWrapper from './UiWrapper.svelte'

  let levelIds: string[] = []

  const fetchAllLevels = async () => {
    const jsons = await import.meta.glob('../Level/levels/**.json')
    const keys = Object.keys(jsons) as string[]
    levelIds = keys
      .map((key) => key.split('/').pop()?.split('.').shift())
      .filter(Boolean) as string[]
  }

  fetchAllLevels()
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-[33vh]">
    <div class="">CAMPAIGN</div>

    {#each levelIds as levelId}
      <button
        on:click={() => {
          actions.startTimeAttack(levelId)
        }}
      >
        {levelId}
      </button>
    {/each}
  </div>
</UiWrapper>

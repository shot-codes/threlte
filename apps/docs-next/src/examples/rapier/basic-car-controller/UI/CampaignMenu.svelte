<script lang="ts">
  import { actions } from '../stores/app'
  import { useKeyDown } from '../useKeyDown'
  import UiWrapper from './UiWrapper.svelte'
  import BackButton from './components/BackButton.svelte'
  import Button from './components/Button.svelte'
  import TopBar from './components/TopBar.svelte'

  let levelIds: string[] = []

  const fetchAllLevels = async () => {
    const jsons = await import.meta.glob('../Level/levels/**.json')
    const keys = Object.keys(jsons) as string[]
    levelIds = keys
      .map((key) => key.split('/').pop()?.split('.').shift())
      .filter(Boolean) as string[]
  }

  fetchAllLevels()

  useKeyDown('Escape', () => {
    actions.goToMainMenu()
  })
</script>

<UiWrapper>
  <TopBar>
    <BackButton
      slot="left"
      on:click={() => {
        actions.goToMainMenu()
      }}
    >
      Back
    </BackButton>

    <p slot="center">CAMPAIGN</p>
  </TopBar>

  <div class="flex flex-col justify-center items-center h-[33vh]">
    {#each levelIds as levelId}
      <Button
        on:click={() => {
          actions.startTimeAttack(levelId)
        }}
      >
        {levelId}
      </Button>
    {/each}
  </div>
</UiWrapper>

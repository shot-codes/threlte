<script lang="ts">
  import { T } from '@threlte/core'
  import { Environment, interactivity } from '@threlte/extras'
  import { Editable, Project, Sheet, Studio } from '@threlte/theatre'
  import ElementSelector from './ElementSelector.svelte'
  import LevelEditor from './LevelEditor.svelte'
  import LevelElements from './LevelElements.svelte'
  import RegisterSheetObject from './RegisterSheetObject.svelte'
  import SelectedSheetObject from './SelectedSheetObject.svelte'
  import Selection from './Selection.svelte'
  import type { ElementConfigurations } from './types'

  // Elements
  import BarrierEnd from './Elements/BarrierEnd.svelte'
  import BarrierTurnLeft from './Elements/BarrierTurnLeft.svelte'
  import BarrierTurnRight from './Elements/BarrierTurnRight.svelte'
  import BasicBox from './Elements/BasicBox.svelte'
  import Boost from './Elements/Boost.svelte'
  import Checkpoint from './Elements/Checkpoint.svelte'
  import CheckpointRing from './Elements/CheckpointRing.svelte'
  import DoubleBarrier from './Elements/DoubleBarrier.svelte'
  import Finish from './Elements/Finish.svelte'
  import HalfBox from './Elements/HalfBox.svelte'
  import Ramp from './Elements/Ramp.svelte'
  import RampInverse from './Elements/RampInverse.svelte'
  import LevelState from './LevelState.svelte'
  import SheetObjectProvider from './SheetObjectProvider.svelte'
  import Barrier from './Elements/Barrier.svelte'
  import Slope from './Elements/Slope.svelte'
  import LoadEvent from './LoadEvent.svelte'
  import ElementContext from './ElementContext.svelte'
  import { gameState, actions } from '../stores/flow'
  import { useKeyPress } from '../useKeyPress'
  import { derived } from 'svelte/store'

  const { gameType, levelId, levelEditor } = gameState
  const { view } = levelEditor

  useKeyPress('e', () => {
    if ($gameType !== 'level-editor') return
    if ($view === 'editor') {
      actions.setLevelEditorView('game')
    } else if ($view === 'game') {
      actions.setLevelEditorView('editor')
    }
  })

  const showLevelEditorUi = derived([gameType, view], ([gameType, view]) => {
    return gameType === 'level-editor' && view === 'editor'
  })

  if ($gameType === 'level-editor') {
    // setup interactivity if we're in the level editor
    interactivity()
  }

  const elementConfigurations: ElementConfigurations = [
    {
      name: 'Box',
      component: BasicBox,
      buttonSvgSource: '📦'
    },

    {
      name: 'HalfBox',
      component: HalfBox,
      buttonSvgSource: 'HB'
    },

    {
      name: 'Ramp',
      component: Ramp,
      buttonSvgSource: 'R'
    },

    {
      name: 'RampInverse',
      component: RampInverse,
      buttonSvgSource: 'RI'
    },

    {
      name: 'Checkpoint',
      component: Checkpoint,
      buttonSvgSource:
        '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" fill="#fff" viewBox="0 0 256 256"><path d="M243.28,68.24l-24-23.56a16,16,0,0,0-22.58,0L104,136h0l-.11-.11L67.25,100.62a16,16,0,0,0-22.57.06l-24,24a16,16,0,0,0,0,22.61l71.62,72a16,16,0,0,0,22.63,0L243.33,90.91A16,16,0,0,0,243.28,68.24ZM103.62,208,32,136l24-24,.11.11,36.64,35.27a16,16,0,0,0,22.52,0L208.06,56,232,79.6Z"></path></svg>'
    },

    {
      name: 'CheckpointRing',
      component: CheckpointRing,
      buttonSvgSource:
        '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" fill="#fff" viewBox="0 0 256 256"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path></svg>'
    },

    {
      name: 'Finish',
      component: Finish,
      buttonSvgSource: '🏁'
    },

    {
      name: 'Boost',
      component: Boost,
      buttonSvgSource: 'B'
    },

    {
      name: 'Barrier',
      component: Barrier,
      buttonSvgSource: 'BA'
    },

    {
      name: 'DoubleBarrier',
      component: DoubleBarrier,
      buttonSvgSource: 'DB'
    },

    {
      name: 'BarrierEnd',
      component: BarrierEnd,
      buttonSvgSource: 'BE'
    },

    {
      name: 'BarrierTurnLeft',
      component: BarrierTurnLeft,
      buttonSvgSource: 'BTL'
    },

    {
      name: 'BarrierTurnRight',
      component: BarrierTurnRight,
      buttonSvgSource: 'BTR'
    },

    {
      name: 'Slope',
      component: Slope,
      buttonSvgSource: 'S'
    }
  ]

  // const rewriteProjectState = (json: any) => {
  //   // in order for Studio to load and write different data than what's stored on disk, we need to
  //   // rewrite the project state before it's loaded. This is a bit of a hack, but it works.
  //   try {
  //     const regularLevelId = $levelId
  //     const editLevelId = `${$levelId}-edit`
  //     json.sheetsById[editLevelId] = json.sheetsById[regularLevelId]
  //     delete json.sheetsById[regularLevelId]
  //     json.sheetsById[editLevelId].staticOverrides.byObject[`${editLevelId}-elements`] =
  //       json.sheetsById[editLevelId].staticOverrides.byObject[`${regularLevelId}-elements`]
  //     delete json.sheetsById[editLevelId].staticOverrides.byObject[`${regularLevelId}-elements`]
  //     console.log(json)
  //     return json
  //   } catch (error) {}
  // }

  const getProjectConfig = async () => {
    try {
      const text = await import(`./levels/${$levelId}.json?raw`)
      return {
        state: JSON.parse(text.default)
      }
    } catch (error) {
      console.log(`Level state for level ${$levelId} not found.`)
      return undefined
    }
  }

  const getProjectName = () => {
    if ($gameType === 'level-editor') {
      return `${$levelId}-edit`
    } else {
      return $levelId
    }
  }
</script>

<Environment
  path="/hdr/"
  files="shanghai_riverside_1k.hdr"
/>

<!-- TODO: DEFAULT BOX, NEEDS TO BE REPLACED BY START BLOCK -->
<BasicBox />

{#await getProjectConfig() then config}
  <Studio
    enabled={$gameType === 'level-editor'}
    hide={!$showLevelEditorUi}
  >
    <Project
      name={getProjectName()}
      {config}
    >
      <Sheet
        name={`${$levelId}`}
        let:sheet
      >
        <LevelElements
          sheetObjectName={`${$levelId}-elements`}
          {sheet}
          {elementConfigurations}
          levelId={$levelId}
          let:objects
          let:sheetObject
          let:entities
          let:levelSheetObjects
          let:checkpointCount
          let:finishCount
        >
          <LevelEditor
            {entities}
            {sheetObject}
            {elementConfigurations}
            {levelSheetObjects}
          />

          <SelectedSheetObject let:selectedObjectKey>
            <LevelState
              {checkpointCount}
              {finishCount}
              let:levelComplete
              on:levelcomplete
            >
              <LoadEvent on:levelloaded />

              <!-- Level Content -->
              {#each objects as [component, name, ids] (name)}
                {#each ids as id (`${name}-${id}`)}
                  <T.Group>
                    <Editable
                      controls={$showLevelEditorUi}
                      transform
                      name={`${name}-${id}`}
                      let:object
                    >
                      <ElementContext name={`${name}-${id}`}>
                        {#if $gameType === 'level-editor'}
                          <!-- Level editor mode -->
                          <!-- Register the sheet object is only mandatory for the level editor -->
                          <RegisterSheetObject
                            {object}
                            {levelSheetObjects}
                          />
                          <SheetObjectProvider sheetObject={object}>
                            <ElementSelector
                              {object}
                              allowSelecting={$showLevelEditorUi}
                            >
                              <svelte:component this={component}>
                                <svelte:fragment slot="selection">
                                  {#if $showLevelEditorUi && selectedObjectKey === object.address.objectKey}
                                    <Selection />
                                  {/if}
                                </svelte:fragment>
                              </svelte:component>
                            </ElementSelector>
                          </SheetObjectProvider>
                        {:else}
                          <!-- Game mode -->
                          <svelte:component this={component} />
                        {/if}
                      </ElementContext>
                    </Editable>
                  </T.Group>
                {/each}
              {/each}

              <slot {levelComplete} />
            </LevelState>
          </SelectedSheetObject>
        </LevelElements>
      </Sheet>
    </Project>
  </Studio>
{/await}

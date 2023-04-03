<script lang="ts">
  import { T } from '@threlte/core'
  import { Editable, Project, Sheet, Studio } from '@threlte/theatre'
  import ElementSelector from './ElementSelector.svelte'
  import RegisterSheetObject from './RegisterSheetObject.svelte'
  import Selection from './Selection.svelte'
  import LevelElements from './LevelElements.svelte'
  import { Environment, interactivity } from '@threlte/extras'
  import LevelEditor from './LevelEditor.svelte'
  import type { ElementConfigurations } from './types'
  import SelectedSheetObject from './SelectedSheetObject.svelte'

  // Elements
  import BasicBox from './Elements/BasicBox.svelte'
  import Checkpoint from './Elements/Checkpoint.svelte'
  import CheckpointRing from './Elements/CheckpointRing.svelte'
  import Finish from './Elements/Finish.svelte'
  import HalfBox from './Elements/HalfBox.svelte'
  import Ramp from './Elements/Ramp.svelte'
  import RampInverse from './Elements/RampInverse.svelte'
  import SheetObjectProvider from './SheetObjectProvider.svelte'
  import LevelState from './LevelState.svelte'
  import { paused } from '../stores/app'

  export let levelId: string
  export let canEdit = false

  export let editing = false

  if (canEdit) {
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
    }
  ]

  $: if (editing) {
    paused.set(true)
  } else {
    paused.set(false)
  }

  const getProjectConfig = async () => {
    try {
      const text = await import(`./levels/${levelId}.json?raw`)
      const json = JSON.parse(text.default)
      return {
        state: json
      }
    } catch (error) {
      console.log(`Level state for level ${levelId} not found.`)
      return undefined
    }
  }
</script>

<svelte:window
  on:keypress={(e) => {
    if (!canEdit) return
    if (e.key === 'e') {
      editing = !editing
    }
  }}
/>

<Environment
  path="/hdr/"
  files="shanghai_riverside_1k.hdr"
/>

<!-- TODO: DEFAULT BOX, NEEDS TO BE REPLACED BY START BLOCK -->
<BasicBox />

{#await getProjectConfig() then config}
  <Studio
    enabled={canEdit}
    hide={!editing}
  >
    <Project
      name={levelId}
      {config}
    >
      <Sheet
        name={levelId}
        let:sheet
      >
        <LevelElements
          {sheet}
          {elementConfigurations}
          {levelId}
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

          <SelectedSheetObject
            {canEdit}
            let:selectedObjectKey
          >
            <LevelState
              {checkpointCount}
              {finishCount}
              let:registerCheckpointReached
              let:registerFinishReached
              let:levelComplete
              on:levelcomplete
            >
              <!-- Level Content -->
              {#each objects as [component, name, ids] (name)}
                {#each ids as id (`${name}-${id}`)}
                  <T.Group>
                    <Editable
                      controls
                      transform
                      name={`${name}-${id}`}
                      let:object
                    >
                      {#if canEdit}
                        <!-- Level editor mode -->
                        <!-- Register the sheet object is only mandatory for the level editor -->
                        <RegisterSheetObject
                          {object}
                          {levelSheetObjects}
                        />
                        <SheetObjectProvider sheetObject={object}>
                          <ElementSelector {object}>
                            <svelte:component
                              this={component}
                              on:checkpointreached={() => {
                                registerCheckpointReached(`${name}-${id}`)
                              }}
                              on:finishreached={() => {
                                registerFinishReached(`${name}-${id}`)
                              }}
                            >
                              <svelte:fragment slot="selection">
                                {#if selectedObjectKey === object.address.objectKey}
                                  <Selection />
                                {/if}
                              </svelte:fragment>
                            </svelte:component>
                          </ElementSelector>
                        </SheetObjectProvider>
                      {:else}
                        <!-- Game mode -->
                        <svelte:component
                          this={component}
                          on:checkpointreached={() => {
                            registerCheckpointReached(`${name}-${id}`)
                          }}
                          on:finishreached={() => {
                            registerFinishReached(`${name}-${id}`)
                          }}
                        />
                      {/if}
                    </Editable>
                  </T.Group>
                {/each}
              {/each}

              <slot
                {levelComplete}
                {editing}
              />
            </LevelState>
          </SelectedSheetObject>
        </LevelElements>
      </Sheet>
    </Project>
  </Studio>
{/await}

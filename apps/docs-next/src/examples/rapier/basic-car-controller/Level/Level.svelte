<script lang="ts">
  import { T } from '@threlte/core'
  import { Editable, Sheet } from '@threlte/theatre'
  import { useLevel } from './Elements/elements'
  import ElementSelector from './Elements/ElementSelector.svelte'
  import RegisterSheetObject from './Elements/RegisterSheetObject.svelte'

  // Elements
  import BasicBox from './Elements/BasicBox.svelte'
  import Ramp from './Elements/Ramp.svelte'
  import { derived } from 'svelte/store'
  import Finish from './Elements/Finish.svelte'
  import { createEventDispatcher } from 'svelte'
  import CheckpointRing from './Elements/CheckpointRing.svelte'
  import RampInverse from './Elements/RampInverse.svelte'
  import HalfBox from './Elements/HalfBox.svelte'
  import Checkpoint from './Elements/Checkpoint.svelte'

  const { registerElements, registerExtension, objects, selectedId } = useLevel('one')

  const dispatch = createEventDispatcher<{
    levelfinished: undefined
  }>()

  registerElements([
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
  ])

  registerExtension()

  const totalCheckpoints = derived(objects, (objects) => {
    return objects.filter(([_, name]) => name.startsWith('Checkpoint')).length
  })

  const checkpointsReached: Set<string> = new Set()

  const onCheckpointReached = (checkpointId: string) => {
    checkpointsReached.add(checkpointId)
  }

  const onFinishReached = () => {
    if (checkpointsReached.size === $totalCheckpoints) {
      dispatch('levelfinished')
    }
  }
</script>

<BasicBox selected={false} />

<!-- <Floor /> -->
<Sheet name="one">
  {#each $objects as [component, name, ids], index (name)}
    {#each ids as id, index (`${name}-${id}`)}
      <T.Group>
        <Editable
          controls
          transform
          name={`${name}-${id}`}
          let:object
        >
          <RegisterSheetObject {object} />
          <ElementSelector {object}>
            <svelte:component
              this={component}
              selected={$selectedId === id}
              name={`${name}-${id}`}
              sheetObject={object}
              on:checkpointreached={() => {
                onCheckpointReached(id)
              }}
              on:finishreached={onFinishReached}
            />
          </ElementSelector>
        </Editable>
      </T.Group>
    {/each}
  {/each}
</Sheet>

<script
  lang="ts"
  context="module"
>
  import { currentWritable, CurrentWritable, useFrame } from '@threlte/core'

  type LevelStateContext = {
    checkpointsReached: CurrentWritable<Set<string>>
    registerCheckpointReached: (checkpointId: string) => void
    registerFinishReached: () => void
  }

  export const useLevelState = () => {
    return getContext<LevelStateContext>('level-state')
  }
</script>

<script lang="ts">
  import { createEventDispatcher, getContext, setContext } from 'svelte'
  import { actions, gameState } from '../stores/app'

  const { levelState, gameType, paused } = gameState

  export let checkpointCount: number
  export let finishCount: number

  $: if (finishCount < 1) console.warn('No finish found')

  const dispatch = createEventDispatcher<{
    levelcomplete: void
  }>()

  const checkpointsReached = currentWritable(new Set<string>())
  let levelComplete = false

  const registerCheckpointReached = (checkpointId: string) => {
    checkpointsReached.update((set) => {
      set.add(checkpointId)
      return set
    })
  }

  const registerFinishReached = () => {
    if (checkpointsReached.current.size === checkpointCount) {
      dispatch('levelcomplete')
      levelComplete = true
    }
  }

  const levelStateContext: LevelStateContext = {
    checkpointsReached,
    registerCheckpointReached,
    registerFinishReached
  }

  setContext<LevelStateContext>('level-state', levelStateContext)

  const resetLevelState = () => {
    checkpointsReached.update((set) => {
      set.clear()
      return set
    })
    levelComplete = false
  }

  useFrame((_, delta) => {
    if ($gameType !== 'time-attack') return
    if ($levelState !== 'playing') return
    if ($paused) return
    actions.incrementTimeAttackTime(delta * 1000)
  })

  actions.use('softResetTimeAttack', resetLevelState)
  actions.use('resetTimeAttack', resetLevelState)
</script>

<slot {levelComplete} />

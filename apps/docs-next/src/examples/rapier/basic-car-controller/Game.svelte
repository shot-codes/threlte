<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls, Portal } from '@threlte/extras'
  import { derived } from 'svelte/store'
  import { PerspectiveCamera, Quaternion, Vector3 } from 'three'
  import { DEG2RAD } from 'three/src/math/MathUtils'
  import Car from './Car.svelte'
  import CountIn from './CountIn.svelte'
  import Level from './Level/Level.svelte'
  import MuscleCar from './MuscleCar.svelte'
  import MuscleCarWheel from './MuscleCarWheel.svelte'
  import { gameState, appState, actions } from './stores/flow'
  import GamePauseMenu from './UI/GamePauseMenu.svelte'
  import { useKeyDown } from './useKeyDown'
  import { useKeyPress } from './useKeyPress'

  const { gameType, levelState, levelEditor, paused } = gameState
  const { view } = levelEditor
  const { visibility, debug } = appState

  useKeyPress('Enter', () => {
    if ($levelState === 'before-count-in') {
      // At this point we're just waiting for user input.
      actions.startCountIn()
    }
    if ($levelState === 'finished' && $gameType === 'time-attack') {
      actions.resetTimeAttack()
    }
    if ($levelState === 'playing' && $gameType === 'time-attack') {
      actions.softResetTimeAttack()
    }
  })

  useKeyDown('Escape', () => {
    actions.toggleGamePaused()
  })

  const carActive = derived(
    [gameType, levelState, visibility, view, paused],
    ([gameType, levelState, visibility, view, paused]) => {
      if (visibility === 'hidden') return false
      if (gameType === 'level-editor' && view === 'editor') return false
      if (paused) return false
      if (levelState === 'playing' || levelState === 'finished') return true
      return false
    }
  )

  const showLevel = derived(levelState, (levelState) => {
    return levelState !== 'loading-level'
  })

  let gameCam: PerspectiveCamera
  let finishCam: PerspectiveCamera

  const { scene } = useThrelte()

  const currentCam = derived([gameType, levelState, view], ([gameType, levelState, view]) => {
    if (gameType === 'level-editor' && view === 'editor') return 'edit'
    if (levelState === 'finished') return 'finish'
    return 'game'
  })

  let respawnCar: () => void

  const onLevelComplete = () => {
    const worldPosition = new Vector3()
    const worldQuaternion = new Quaternion()
    gameCam.getWorldPosition(worldPosition)
    gameCam.getWorldQuaternion(worldQuaternion)
    finishCam.position.copy(worldPosition)
    finishCam.quaternion.copy(worldQuaternion)
    actions.levelFinished()
  }

  actions.use('softResetTimeAttack', () => {
    respawnCar?.()
  })
  actions.use('resetTimeAttack', () => {
    respawnCar?.()
  })
</script>

{#if $paused}
  <GamePauseMenu />
{/if}

{#if $levelState === 'count-in'}
  <CountIn
    on:countindone={() => {
      actions.startGamePlay()
    }}
  />
{/if}

<T.Group visible={$showLevel}>
  <Level
    on:levelcomplete={() => {
      onLevelComplete()
    }}
    on:levelloaded={() => {
      actions.levelLoaded()
    }}
  >
    <!-- FINISH CAM -->
    <T.PerspectiveCamera
      bind:ref={finishCam}
      makeDefault={$currentCam === 'finish'}
      fov={70}
    />

    <Car
      bind:respawn={respawnCar}
      debug={$debug}
      active={$carActive}
    >
      <T.PerspectiveCamera
        bind:ref={gameCam}
        slot="camera"
        rotation={[-90 * DEG2RAD, 75 * DEG2RAD, 90 * DEG2RAD]}
        fov={70}
        makeDefault={$currentCam === 'game'}
      />

      <svelte:fragment
        slot="body"
        let:carState
      >
        <T.Group rotation.y={(-90 * Math.PI) / 180}>
          <MuscleCar isBraking={carState.isBraking} />
        </T.Group>
      </svelte:fragment>

      <T.Group
        rotation.y={(90 * Math.PI) / 180}
        slot="wheel-fl"
      >
        <MuscleCarWheel />
      </T.Group>

      <T.Group
        rotation.y={(90 * Math.PI) / 180}
        slot="wheel-fr"
      >
        <MuscleCarWheel />
      </T.Group>

      <T.Group
        rotation.y={(90 * Math.PI) / 180}
        slot="wheel-rl"
      >
        <MuscleCarWheel />
      </T.Group>

      <T.Group
        rotation.y={(90 * Math.PI) / 180}
        slot="wheel-rr"
      >
        <MuscleCarWheel />
      </T.Group>

      <svelte:fragment let:carState>
        <T.DirectionalLight
          intensity={0.4}
          position.x={carState.worldPosition.x + 8}
          position.y={carState.worldPosition.y + 20}
          position.z={carState.worldPosition.z - 3}
          shadow.camera.left={-10}
          shadow.camera.right={10}
          shadow.camera.top={10}
          shadow.camera.bottom={-10}
          castShadow
          let:ref
        >
          <Portal object={scene}>
            <T
              is={ref.target}
              position.x={carState.worldPosition.x}
              position.y={carState.worldPosition.y}
              position.z={carState.worldPosition.z}
            />
          </Portal>
        </T.DirectionalLight>
      </svelte:fragment>
    </Car>

    <!-- Level editing camera -->
    <T.PerspectiveCamera
      position.x={30}
      position.y={30}
      position.z={30}
      fov={70}
      makeDefault={$currentCam === 'edit'}
    >
      <OrbitControls />
    </T.PerspectiveCamera>
  </Level>
</T.Group>

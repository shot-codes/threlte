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
  import GamePauseMenu from './UI/GamePauseMenu.svelte'
  import LevelIntroMenu from './UI/LevelIntroMenu.svelte'
  import TimeAttackFinished from './UI/TimeAttackFinished.svelte'
  import TimeAttackUi from './UI/TimeAttackUi.svelte'
  import { actions, appState, gameState } from './stores/app'
  import { useKeyDown } from './useKeyDown'
  import { useKeyPress } from './useKeyPress'
  import LoadingUi from './UI/LoadingUi.svelte'
  import { sunPos } from './config'

  const { gameType, levelState, levelEditor, paused, levelId } = gameState
  const { view } = levelEditor
  const { visibility, debug } = appState

  useKeyPress('Enter', () => {
    if ($levelState === 'level-intro') {
      // when we're in the level editor, we jump straight to game play without a
      // count-in.
      if ($gameType === 'level-editor') {
        actions.startGamePlay()
      } else {
        // For other game modes, we start the count-in.
        actions.startCountIn()
      }
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

  const showCountIn = derived([gameType, levelState, paused], ([gameType, levelState, paused]) => {
    if (gameType === 'level-editor') return false
    if (levelState !== 'count-in') return false
    if (paused) return false
    return true
  })

  const showLevelIntro = derived(
    [gameType, view, levelState, paused],
    ([gameType, view, levelState, paused]) => {
      if (paused) return false
      if (levelState !== 'level-intro') return false
      if (gameType === 'level-editor' && view === 'editor') return false
      return true
    }
  )

  const showTimeAttackUi = derived(
    [gameType, levelState, paused],
    ([gameType, levelState, paused]) => {
      if (gameType !== 'time-attack') return false
      if (levelState !== 'playing') return false
      if (paused) return false
      return true
    }
  )

  const carVolume = derived([paused, gameType, view], ([paused, gameType, view]) => {
    if (paused) return 0
    if (gameType === 'level-editor' && view === 'editor') return 0
    return 1
  })

  const showTimeAttackFinishedUi = derived([gameType, levelState], ([gameType, levelState]) => {
    if (gameType !== 'time-attack') return false
    if (levelState !== 'finished') return false
    return true
  })

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

{#if $levelState === 'loading-level'}
  <LoadingUi />
{/if}

{#if $showTimeAttackUi}
  <TimeAttackUi />
{/if}

{#if $paused}
  <GamePauseMenu />
{/if}

{#if $showTimeAttackFinishedUi}
  <TimeAttackFinished />
{/if}

{#if $showLevelIntro}
  <LevelIntroMenu levelId={$levelId} />
{/if}

{#if $showCountIn}
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
      volume={$carVolume}
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
          position.x={carState.worldPosition.x + sunPos[0] * 10}
          position.y={carState.worldPosition.y + sunPos[1] * 10}
          position.z={carState.worldPosition.z + sunPos[0] * 10}
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

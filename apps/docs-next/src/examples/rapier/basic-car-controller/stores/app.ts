import type { CurrentWritable } from '@threlte/core'
import { buildActions, createState, toCurrentReadable } from './utils'

/**
 * -----------------------------------------------------
 * STATE
 * -----------------------------------------------------
 *
 * To truly isolate state manipulation from consumption,
 * the states in this file only return read-only stores and
 * manipulating the state is only possible through "actions".
 *
 * Some of the actions also implement event emitters because some
 * logic cannot be implemented in the stores alone.
 */

type AppState = {
  readonly state: CurrentWritable<'menu' | 'game'>
  readonly visibility: CurrentWritable<'visible' | 'hidden'>
  readonly debug: CurrentWritable<boolean>
}

type MenuState = {
  readonly state: CurrentWritable<'main' | 'user-levels' | 'campaign' | 'options' | 'credits'>
}

type GameType = 'time-attack' | 'level-editor'
type LevelState = 'loading-level' | 'level-intro' | 'count-in' | 'playing' | 'finished'
type GameState = {
  readonly levelId: CurrentWritable<string>
  readonly gameType: CurrentWritable<GameType>
  readonly levelState: CurrentWritable<LevelState>
  readonly paused: CurrentWritable<boolean>
  readonly timeAttack: {
    readonly time: CurrentWritable<number>
  }
  readonly levelEditor: {
    readonly view: CurrentWritable<'game' | 'editor'>
  }
}

/**
 * -----------------------------------------------------
 * App State
 * -----------------------------------------------------
 */
const _appState: AppState = {
  state: createState('menu'),
  visibility: createState('visible'),
  debug: createState(false)
}

/**
 * Immutable app state
 */
export const appState = {
  state: toCurrentReadable(_appState.state),
  visibility: toCurrentReadable(_appState.visibility),
  debug: toCurrentReadable(_appState.debug)
}

/**
 * -----------------------------------------------------
 * Menu State
 * -----------------------------------------------------
 */
const _menuState: MenuState = {
  state: createState('main')
}

/**
 * Immutable menu state
 */
export const menuState = {
  state: toCurrentReadable(_menuState.state)
}

/**
 * -----------------------------------------------------
 * Game State
 * -----------------------------------------------------
 */
const _gameState: GameState = {
  levelState: createState('loading-level'),
  gameType: createState('time-attack'),
  levelId: createState('level-1'),
  paused: createState(false),
  timeAttack: {
    time: createState(0)
  },
  levelEditor: {
    view: createState('editor')
  }
}

/**
 * Immutable game state
 */
export const gameState = {
  levelState: toCurrentReadable(_gameState.levelState),
  gameType: toCurrentReadable(_gameState.gameType),
  levelId: toCurrentReadable(_gameState.levelId),
  paused: toCurrentReadable(_gameState.paused),
  timeAttack: {
    time: toCurrentReadable(_gameState.timeAttack.time)
  },
  levelEditor: {
    view: toCurrentReadable(_gameState.levelEditor.view)
  }
}

export const actions = buildActions(
  {
    /**
     * -----------------------------------------------------
     * App Actions
     * -----------------------------------------------------
     */

    setDebug: (debug: boolean) => {
      _appState.debug.set(debug)
    },

    toggleDebug: () => {
      _appState.debug.set(!_appState.debug.current)
    },

    setVisibility: (visibility: 'visible' | 'hidden') => {
      _appState.visibility.set(visibility)
    },

    /**
     * -----------------------------------------------------
     * Menu Actions
     * -----------------------------------------------------
     */
    goToMainMenu: () => {
      _appState.state.set('menu')
      _menuState.state.set('main')
    },

    goToCampaignMenu: () => {
      _appState.state.set('menu')
      _menuState.state.set('campaign')
    },

    goToUserLevelsMenu: () => {
      _appState.state.set('menu')
      _menuState.state.set('user-levels')
    },

    goToOptionsMenu: () => {
      _appState.state.set('menu')
      _menuState.state.set('options')
    },

    goToCreditsMenu: () => {
      _appState.state.set('menu')
      _menuState.state.set('credits')
    },

    /**
     * -----------------------------------------------------
     * Game Actions
     * -----------------------------------------------------
     *
     * These actions should be called as close to Game.svelte
     * as possible and reasonable.
     */

    startTimeAttack: (levelId: string) => {
      _appState.state.set('game')
      _gameState.levelState.set('loading-level')
      _gameState.levelId.set(levelId)
      _gameState.paused.set(false)
      _gameState.gameType.set('time-attack')
      _gameState.timeAttack.time.set(0)
    },

    startLevelEditor: (levelId: string) => {
      _appState.state.set('game')
      _gameState.levelState.set('loading-level')
      _gameState.levelId.set(levelId)
      _gameState.paused.set(false)
      _gameState.gameType.set('level-editor')
      _gameState.levelEditor.view.set('editor')
    },

    levelLoaded: () => {
      if (_appState.state.current !== 'game') return false
      if (_gameState.levelState.current !== 'loading-level') return false
      _gameState.levelState.set('level-intro')
    },

    startCountIn: () => {
      if (_appState.state.current !== 'game') return false
      if (_gameState.levelState.current !== 'level-intro') return false
      _gameState.levelState.set('count-in')
    },

    /**
     * The count-in is finished, the user takes control of the car.
     */
    startGamePlay: () => {
      if (_appState.state.current !== 'game') return false
      if (_gameState.levelState.current !== 'count-in') return false
      _gameState.levelState.set('playing')
    },

    /**
     * The level is finished, the user may restart the level.
     */
    levelFinished: () => {
      if (_appState.state.current !== 'game') return false
      if (_gameState.levelState.current !== 'playing') return false
      _gameState.levelState.set('finished')
    },

    /**
     * The time is incremented to prevent accidentally setting it higher in the
     * event of a game pause or other situations.
     * This action does not emit an event!
     */
    incrementTimeAttackTime: (time: number) => {
      if (_appState.state.current !== 'game') return false
      if (_gameState.gameType.current !== 'time-attack') return false
      if (_gameState.levelState.current !== 'playing') return false
      if (_gameState.paused.current) return false
      _gameState.timeAttack.time.update((t) => t + time)
      return { debug: false }
    },

    /**
     * After finishing a level, the user may restart the level.
     * We begin *before* the count-in.
     */
    resetTimeAttack: () => {
      if (_appState.state.current !== 'game') return false
      _gameState.levelState.set('level-intro')
      _gameState.timeAttack.time.set(0)
    },

    /**
     * While playing the level, the user may soft-reset the level.
     * We begin *during* the count-in, so the game play is not affected.
     */
    softResetTimeAttack: () => {
      if (_appState.state.current !== 'game') return false
      _gameState.levelState.set('count-in')
      _gameState.timeAttack.time.set(0)
    },

    setLevelEditorView: (view: 'game' | 'editor') => {
      if (_appState.state.current !== 'game') return false
      if (_gameState.gameType.current !== 'level-editor') return false
      if (view === 'game') {
        _gameState.levelState.set('playing')
      }
      _gameState.levelEditor.view.set(view)
    },

    pauseGame: () => {
      if (_appState.state.current !== 'game') return false
      _gameState.paused.set(true)
    },

    resumeGame: () => {
      if (_appState.state.current !== 'game') return false
      _gameState.paused.set(false)
    },

    toggleGamePaused: () => {
      if (_appState.state.current !== 'game') return false
      if (_gameState.paused.current) actions.resumeGame()
      else actions.pauseGame()
    }
  },
  { debug: true }
)

export const printState = () => {
  console.log('appState', JSON.stringify(appState, null, 2))
  console.log('menuState', JSON.stringify(menuState, null, 2))
  console.log('gameState', JSON.stringify(gameState, null, 2))
}

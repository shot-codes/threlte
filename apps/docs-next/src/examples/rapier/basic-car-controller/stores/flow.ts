// We're either in the Menu or in the Game

import { currentWritable, CurrentWritable } from '@threlte/core'
import { buildActions, toCurrentReadable } from './utils'
import type { Emitter } from 'mitt'
import mitt from 'mitt'

type Events = {
  foo: string
  bar?: number
}

// const emitter =

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
  readonly state: CurrentWritable<'main' | 'campaign' | 'options' | 'credits'>
}

type GameType = 'time-attack' | 'level-editor'
type LevelState = 'loading-level' | 'before-count-in' | 'count-in' | 'playing' | 'finished'
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
  state: currentWritable('menu'),
  visibility: currentWritable('visible'),
  debug: currentWritable(false)
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
  state: currentWritable('main')
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
  levelState: currentWritable('loading-level'),
  gameType: currentWritable('time-attack'),
  levelId: currentWritable('level-1'),
  paused: currentWritable(false),
  timeAttack: {
    time: currentWritable(0)
  },
  levelEditor: {
    view: currentWritable('editor')
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

export const actions = buildActions({
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
    if (_appState.state.current !== 'game') return
    if (_gameState.levelState.current !== 'loading-level') return
    _gameState.levelState.set('before-count-in')
  },

  startCountIn: () => {
    if (_appState.state.current !== 'game') return
    if (_gameState.levelState.current !== 'before-count-in') return
    _gameState.levelState.set('count-in')
  },

  /**
   * The count-in is finished, the user takes control of the car.
   */
  startGamePlay: () => {
    if (_appState.state.current !== 'game') return
    if (_gameState.levelState.current !== 'count-in') return
    _gameState.levelState.set('playing')
  },

  /**
   * The level is finished, the user may restart the level.
   */
  levelFinished: () => {
    if (_appState.state.current !== 'game') return
    if (_gameState.levelState.current !== 'playing') return
    _gameState.levelState.set('finished')
  },

  setTimeAttackTime: (time: number) => {
    if (_appState.state.current !== 'game') return
    if (_gameState.gameType.current !== 'time-attack') return
    _gameState.timeAttack.time.set(time)
  },

  /**
   * After finishing a level, the user may restart the level.
   * We begin *before* the count-in.
   */
  resetTimeAttack: () => {
    if (_appState.state.current !== 'game') return
    _gameState.levelState.set('before-count-in')
    _gameState.timeAttack.time.set(0)
  },

  /**
   * While playing the level, the user may soft-reset the level.
   * We begin *during* the count-in, so the game play is not affected.
   */
  softResetTimeAttack: () => {
    if (_appState.state.current !== 'game') return
    _gameState.levelState.set('count-in')
    _gameState.timeAttack.time.set(0)
  },

  setLevelEditorView: (view: 'game' | 'editor') => {
    if (_appState.state.current !== 'game') return
    if (_gameState.gameType.current !== 'level-editor') return
    _gameState.levelEditor.view.set(view)
  },

  pauseGame: () => {
    if (_appState.state.current !== 'game') return
    _gameState.paused.set(true)
  },

  resumeGame: () => {
    if (_appState.state.current !== 'game') return
    _gameState.paused.set(false)
  },

  toggleGamePaused: () => {
    if (_appState.state.current !== 'game') return
    if (_gameState.paused.current) _gameState.paused.set(false)
    else _gameState.paused.set(true)
  }
})

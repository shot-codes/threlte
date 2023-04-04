import { currentWritable } from '@threlte/core'

export const debug = currentWritable(false)

export const paused = currentWritable(false)

export type AppState = 'intro' | 'menu' | 'game'
export const appState = currentWritable<AppState>('intro')

export type GameType = 'time-attack' | 'trial' | 'level-editor'
export const gameType = currentWritable<GameType>('time-attack')

export type GameState = 'loading-level' | 'before-count-in' | 'count-in' | 'playing' | 'finished'
export const gameState = currentWritable<GameState>('loading-level')

export const isEditing = currentWritable(false)

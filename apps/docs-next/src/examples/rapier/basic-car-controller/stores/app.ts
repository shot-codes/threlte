import { currentWritable } from '@threlte/core'

export const debug = currentWritable(false)

export const paused = currentWritable(false)

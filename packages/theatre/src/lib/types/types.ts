import type { IProject, ISheet } from '@theatre/core'
import type { IStudio } from '@theatre/studio'
import type { CurrentWritable } from '@threlte/core'

export type TheatreContext = {
  studio: CurrentWritable<IStudio | undefined>
  defaultProject: CurrentWritable<IProject | undefined>
  defaultSheet: CurrentWritable<ISheet | undefined>
}

import type { ISheetObject } from '@theatre/core'
import { currentWritable } from '@threlte/core'
import { onDestroy, onMount, tick } from 'svelte'

export const useSheetObjectToUpdateAutoColliders = (object?: ISheetObject) => {
  const refresh = currentWritable<() => void>(undefined as any)

  onMount(async () => {
    await tick()
    refresh.current?.()
  })

  const unsubscribe = object?.onValuesChange(() => {
    refresh.current?.()
  })

  onDestroy(() => {
    unsubscribe?.()
  })

  return {
    refresh
  }
}

import type { ISheetObject } from '@theatre/core'
import { getContext, onDestroy } from 'svelte'

export const useSheetObject = (callback?: (values: ISheetObject['value']) => void) => {
  const sheetObject = getContext<ISheetObject | undefined>('sheetObject')

  const unsubscribe = sheetObject?.onValuesChange((values) => {
    callback?.(values)
  })

  onDestroy(() => {
    unsubscribe?.()
  })

  return { sheetObject }
}

import { useSheetObject } from './useSheetObject'

export const useRefreshCollider = () => {
  let refreshFns: any[] = []

  useSheetObject(() => {
    refreshFns.forEach((fn) => fn())
  })

  return {
    refreshFns
  }
}

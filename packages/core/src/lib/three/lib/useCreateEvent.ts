import { useThrelte } from '../../hooks/useThrelte'
import type { ThrelteContext } from '../../types/types'
import { get_current_component, onDestroy, onMount } from 'svelte/internal'
import { derived, writable } from 'svelte/store'

export const useCreateEvent = <T extends any>(ref: T) => {
  const ctx = useThrelte()

  const component = get_current_component()

  const refStore = writable<T>(ref)
  const hasCreateCallbacks = writable(false)
  const isMounted = writable(false)
  let cleanupHandlers: (() => void)[] = []

  onMount(() => {
    isMounted.set(true)
    hasCreateCallbacks.set('create' in component.$$.callbacks)
  })

  const runCallbacks = derived(
    [hasCreateCallbacks, isMounted, refStore],
    ([hasCreateCallbacks, isMounted, ref]) => {
      return {
        run: hasCreateCallbacks && isMounted && ref,
        ref
      }
    }
  )

  const unsubscribe = runCallbacks.subscribe(({ ref, run }) => {
    if (run) {
      cleanupHandlers.forEach((handler) => handler())
      cleanupHandlers = component.$$.callbacks.create
        .map((h: (arg: ThrelteContext & { ref: typeof ref }) => void) =>
          h({
            ...ctx,
            ref
          })
        )
        .filter(Boolean)
    }
  })
  onDestroy(unsubscribe)

  const updateRef = (ref: T) => {
    refStore.set(ref)
  }

  return {
    updateRef
  }
}

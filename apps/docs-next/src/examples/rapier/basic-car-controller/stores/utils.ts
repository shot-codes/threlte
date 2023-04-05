import type { CurrentWritable } from '@threlte/core'
import mitt, { Emitter } from 'mitt'
import { onDestroy } from 'svelte'
import type { Readable } from 'svelte/store'

export const toCurrentReadable = <T>(
  store: CurrentWritable<T>
): Readable<T> & {
  current: T
} => store

/**
 * Build actions from a record of functions.
 *
 * Actions should be the only way to mutate stores.
 * Because some logic cannot be reasonably implemented in reactive stores,
 * actions can also emit events. If an action returns false,
 * the event is not emitted and its debug message is not logged.
 */
export const buildActions = <Actions extends Record<string, (...args: any[]) => void | false>>(
  actions: Actions,
  options?: {
    debug?: boolean
  }
): Actions &
  Emitter<Record<keyof Actions, void>> & {
    use: (name: keyof Actions, callback: () => void) => void
  } => {
  type ActionEvents = {
    [event in keyof typeof actions]: void
  }

  const events = mitt<ActionEvents>()

  const keys = Object.keys(actions) as (keyof typeof actions)[]

  const proxyActions = keys.reduce((acc, key) => {
    const action = actions[key]!
    acc[key] = ((...args: any[]) => {
      const rt = action(...(args as []))
      // The action is voided if it returns false
      if (rt === false) return
      if (options?.debug) {
        const payload = args.map((a) => JSON.stringify(a))
        const actionName = String(key)
        const actionDesc = payload.length
          ? `${actionName}(${payload.join(', ')})`
          : `${actionName}()`
        console.log(
          `%c${` ACTION %c %c${actionDesc}`}`,
          'color: white; background: blue;',
          'background: transparent;',
          'color: inherit;'
        )
      }
      events.emit(key as keyof typeof actions)
    }) as any
    return acc
  }, {} as typeof actions & Emitter<Record<keyof Actions, void>> & { use: any })

  Object.assign(proxyActions, events)

  // hook for emitter
  const use = (name: Parameters<Emitter<ActionEvents>['on']>[0], callback: () => void) => {
    events.on(name, callback)

    onDestroy(() => {
      events.off(name, callback)
    })
  }

  Object.assign(proxyActions, { use })

  return proxyActions
}

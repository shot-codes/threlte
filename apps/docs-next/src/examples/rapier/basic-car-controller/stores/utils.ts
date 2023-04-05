import type { CurrentWritable } from '@threlte/core'
import mitt, { Emitter } from 'mitt'
import { onDestroy } from 'svelte'
import type { Readable } from 'svelte/store'

export const toCurrentReadable = <T>(
  store: CurrentWritable<T>
): Readable<T> & {
  current: T
} => store

export const buildActions = <Actions extends Record<string, (...args: any[]) => void>>(
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
      action(...(args as []))
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

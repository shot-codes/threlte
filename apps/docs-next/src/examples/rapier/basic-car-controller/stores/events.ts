import { derived, Readable } from 'svelte/store'

type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>

type StoresValues<T> = T extends Readable<infer U>
  ? U
  : {
      [K in keyof T]: T[K] extends Readable<infer U> ? U : never
    }

export const onChange = <S extends Stores, T>(stores: S, callback: () => void) => {
  const values = derived(stores, (stores) => {
    return stores as StoresValues<S>
  })

  return values.subscribe(callback)
}

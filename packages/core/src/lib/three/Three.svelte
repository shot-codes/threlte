<script
  lang="ts"
  context="module"
>
  // Type Gaurds
  const isClass = (value: any): value is AnyClass => {
    return typeof value === 'function' && /^\s*class\s+/.test(value.toString())
  }
  const isArray = (value: any): value is any[] => {
    return Array.isArray(value)
  }
  const extendsObject3D = (object: any): object is Object3D => {
    return !!(object as any).isObject3D
  }
  const isDisposableObject = (object: any): object is DisposableThreeObject => {
    return (object as any).dispose !== undefined
  }
</script>

<script lang="ts">
  import { useThrelte } from '../hooks/useThrelte'
  import { getContext, setContext } from 'svelte'
  import { writable, type Writable } from 'svelte/store'
  import type { Object3D } from 'three'
  import DisposableObject from '../internal/DisposableObject.svelte'
  import SceneGraphObject from '../internal/SceneGraphObject.svelte'
  import type { DisposableThreeObject } from '../types/components'
  import { useAttach } from './lib/useAttach'
  import { useCamera } from './lib/useCamera'
  import { useEvents } from './lib/useEvents'
  import { useProps } from './lib/useProps'
  import { useCreateEvent } from './lib/useCreateEvent'
  import type { AnyClass, MaybeInstance, Props } from './types'

  type Type = $$Generic

  type AllProps = {
    type: Type
  } & Props<Type>
  type $$Props = AllProps

  export let type: Type
  export let args: AllProps['args'] = undefined as AllProps['args']
  export let attach: AllProps['attach'] = undefined as AllProps['attach']
  export let manual: AllProps['manual'] = undefined as unknown as AllProps['manual']
  export let makeDefault: AllProps['makeDefault'] = undefined as unknown as AllProps['makeDefault']
  export let dispose: AllProps['dispose'] = undefined as unknown as AllProps['dispose']

  type ThrelteThreeParentContext = Writable<any | undefined>
  const parent = getContext<ThrelteThreeParentContext>('threlte-hierarchical-parent-context')

  const ctx = useThrelte()

  const makeRef = (type: Type, args: AllProps['args']) => {
    if (!isClass(type)) {
      return type
    }
    if (isArray(args)) {
      return new type(...args)
    }
    if (!args) {
      return new type()
    }
    return new type(...args(ctx))
  }

  // We can't create the object in a reactive statement due to providing context
  export let ref = makeRef(type, args) as MaybeInstance<Type>
  // The hierarchical context needs a store to be reactive
  const objectStore = writable(ref)
  let initialized = false
  $: if (initialized) {
    ref = makeRef(type, args) as MaybeInstance<Type>
    objectStore.set(ref)
  } else {
    initialized = true
  }
  setContext<ThrelteThreeParentContext>('threlte-hierarchical-parent-context', objectStore)

  // "Create" Event
  const createEvent = useCreateEvent(ref)
  $: createEvent.updateRef(ref)

  // Props
  const props = useProps()
  $: props.updateProps(ref, $$restProps, { manualCamera: manual })

  // Camera
  const camera = useCamera()
  $: camera.update(ref, manual)
  $: camera.makeDefaultCamera(ref, makeDefault)

  // Attachment
  const attachment = useAttach()
  $: attachment.update(ref, $parent, attach)

  const events = useEvents()
  $: events.updateRef(ref)
</script>

{#if isDisposableObject(ref)}
  <DisposableObject
    object={ref}
    {dispose}
  />
{/if}

{#if extendsObject3D(ref)}
  <SceneGraphObject object={ref}>
    <slot {ref} />
  </SceneGraphObject>
{:else}
  <slot {ref} />
{/if}

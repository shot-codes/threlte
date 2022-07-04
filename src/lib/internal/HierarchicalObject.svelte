<!--
  @component

  This component is the backbone of the scene graph hierarchy system.
  Child objects that also house this component register themselves onto
  this component and let the parent decide on what to do with it.
  
-->
<script lang="ts" context="module">
  import { getContext, onDestroy, setContext } from 'svelte'
  import type { Writable } from 'svelte/store'
  import type { Object3D as ThreeObject3D } from 'three'
  import { useThrelte } from '../hooks/useThrelte'
  import type { HierarchicalObjectProperties } from '../types/components'

  const useHierarchicalObject = () => {
    return {
      onChildMount: getContext<HierarchicalObjectProperties['onChildMount']>(
        'threlte-hierarchical-object-on-mount'
      ),
      onChildDestroy: getContext<HierarchicalObjectProperties['onChildDestroy']>(
        'threlte-hierarchical-object-on-destroy'
      )
    }
  }

  type ThrelteParentContext = {
    parent: ThreeObject3D | undefined
    parentStore: Writable<ThreeObject3D | undefined>
    getParent: () => ThreeObject3D | undefined
  }

  export const useGetParent = () => {
    return getContext<ThrelteParentContext>('threlte-hierarchical-parent-context')
  }
</script>

<script lang="ts">
  import { createObjectStore } from '$lib/lib/createObjectStore'

  export let object: HierarchicalObjectProperties['object'] = undefined
  const objectStore = createObjectStore(object)
  $: objectStore.set(object)

  export let onChildMount: HierarchicalObjectProperties['onChildMount'] = (child) => {
    if (object) object.add(child)
  }
  export let onChildDestroy: HierarchicalObjectProperties['onChildDestroy'] = (child) => {
    if (object) object.remove(child)
  }

  const { invalidate } = useThrelte()

  const callbacks = useHierarchicalObject()
  invalidate('HierarchicalObject: object added')
  if (object) callbacks.onChildMount?.(object)
  onDestroy(() => {
    if (object) callbacks.onChildDestroy?.(object)
    invalidate('HierarchicalObject: object removed')
  })

  setContext<HierarchicalObjectProperties['onChildMount']>(
    'threlte-hierarchical-object-on-mount',
    onChildMount
  )
  setContext<HierarchicalObjectProperties['onChildDestroy']>(
    'threlte-hierarchical-object-on-destroy',
    onChildDestroy
  )

  setContext<ThrelteParentContext>('threlte-hierarchical-parent-context', {
    getParent: () => object,
    parent: object,
    parentStore: objectStore
  })
</script>

<slot />

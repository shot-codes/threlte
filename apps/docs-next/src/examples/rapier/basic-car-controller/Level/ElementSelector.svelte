<script lang="ts">
  import type { ISheetObject } from '@theatre/core'
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { useStudio } from '@threlte/theatre'
  import { onDestroy, onMount } from 'svelte'

  const { studio } = useStudio()

  export let object: ISheetObject
  export let editing: boolean

  const onClick = (e: any) => {
    if (!editing) return
    e.stopPropagation()
    studio.current?.setSelection([object])
  }

  const { onPointerEnter, onPointerLeave } = useCursor()

  onMount(() => {
    studio.current?.setSelection([object])
  })

  onDestroy(() => {
    const currentSelection = studio.current?.selection
    if (currentSelection?.includes(object)) {
      studio.current?.setSelection([])
    }
  })
</script>

<T.Group
  on:pointermissed={() => {
    if (!editing) return
    studio.current?.setSelection([])
  }}
  on:pointerleave={() => {
    if (!editing) return
    onPointerLeave()
  }}
  on:pointerenter={(e) => {
    if (!editing) return
    e.stopPropagation()
    onPointerEnter()
  }}
  on:click={onClick}
>
  <slot />
</T.Group>

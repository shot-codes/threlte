<script lang="ts">
  import type { ISheetObject } from '@theatre/core'
  import { T } from '@threlte/core'
  import { useCursor } from '@threlte/extras'
  import { useTheatre } from '@threlte/theatre'

  const { studio } = useTheatre()

  export let object: ISheetObject

  const onClick = (e: any) => {
    e.stopPropagation()
    studio.current?.setSelection([object])
  }

  const { onPointerEnter, onPointerLeave } = useCursor()
</script>

<T.Group
  on:pointermissed={() => {
    studio.current?.setSelection([])
  }}
  on:pointerleave={onPointerLeave}
  on:pointerenter={(e) => {
    e.stopPropagation()
    onPointerEnter()
  }}
  on:click={onClick}
>
  <slot />
</T.Group>

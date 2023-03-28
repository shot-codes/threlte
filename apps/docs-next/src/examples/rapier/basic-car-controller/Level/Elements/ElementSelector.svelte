<script lang="ts">
  import type { ISheetObject } from '@theatre/core'
  import { T } from '@threlte/core'
  import { useTheatre } from '@threlte/theatre'

  const { studio } = useTheatre()

  export let object: ISheetObject

  const onClick = (e: any) => {
    e.stopPropagation()
    studio.current?.setSelection([object])
  }
</script>

<T.Group
  on:pointermissed={() => {
    studio.current?.setSelection([])
  }}
  on:click={onClick}
>
  <slot />
</T.Group>

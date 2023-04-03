<script lang="ts">
  import type { ISheetObject } from '@theatre/core'
  import { setContext } from 'svelte'

  export let sheetObject: ISheetObject

  setContext<ISheetObject>('sheetObject', sheetObject)
</script>

<slot />

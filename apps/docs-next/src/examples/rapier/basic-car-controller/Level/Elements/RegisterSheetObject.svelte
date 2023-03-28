<script lang="ts">
  import type { ISheetObject } from '@theatre/core'
  import type { CurrentWritable } from '@threlte/core'
  import { getContext, onDestroy } from 'svelte'

  export let object: ISheetObject

  const levelSheetObjects =
    getContext<CurrentWritable<Record<string, ISheetObject>>>('level-sheet-objects')

  levelSheetObjects.update((sheetObjects) => {
    sheetObjects[object.address.objectKey] = object
    return sheetObjects
  })

  onDestroy(() => {
    levelSheetObjects.update((sheetObjects) => {
      delete sheetObjects[object.address.objectKey]
      return sheetObjects
    })
  })
</script>

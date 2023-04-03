<script lang="ts">
  import type { ISheetObject } from '@theatre/core'
  import type { CurrentWritable } from '@threlte/core'
  import { onDestroy } from 'svelte'

  export let object: ISheetObject
  export let levelSheetObjects: CurrentWritable<Record<string, ISheetObject>>

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

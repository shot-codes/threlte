<script lang="ts">
  import type { ISheetObject } from '@theatre/core'
  import { watch } from '@threlte/core'
  import { useStudio } from '@threlte/theatre'

  const { studio } = useStudio()

  const isISheetObject = (obj: any): obj is ISheetObject => {
    return obj && obj.type === 'Theatre_SheetObject_PublicAPI'
  }

  let selectedObjectKey: string | undefined = undefined

  watch(studio, (studio) => {
    const unsubscribe = studio?.onSelectionChange((selection) => {
      const selectedSheetObject = selection[0]
      if (isISheetObject(selectedSheetObject)) {
        selectedObjectKey = selectedSheetObject.address.objectKey
      } else {
        selectedObjectKey = undefined
      }
    })
    return () => {
      unsubscribe?.()
    }
  })
</script>

<slot {selectedObjectKey} />

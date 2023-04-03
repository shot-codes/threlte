<script lang="ts">
  import type { ISheet, ISheetObject } from '@theatre/core'
  import { currentWritable } from '@threlte/core'
  import { onDestroy } from 'svelte'
  import type { ElementConfigurations } from './types'

  export let sheet: ISheet
  export let levelId: string

  export let elementConfigurations: ElementConfigurations
  /**
   * This is a map of all the sheet objects in the level
   */
  const levelSheetObjects = currentWritable<Record<string, ISheetObject>>({})

  let entities = elementConfigurations.reduce((acc, element) => {
    acc[element.name] = ''
    return acc
  }, {} as Record<string, string>)

  const parseString = (str: string) => {
    const ids = str.split(',').filter((id) => id !== '')
    return ids
  }

  $: objects = Object.entries(entities).map(([key, value]) => {
    const component = elementConfigurations.find((element) => element.name === key)?.component
    return [component, key, parseString(value)] as [any, string, string[]]
  })

  const sheetObject = sheet?.object(
    `${levelId}-elements`,
    {
      ...entities
    },
    {
      reconfigure: true
    }
  )

  const unsubscriber = sheetObject.onValuesChange((values) => {
    entities = values
  })

  onDestroy(() => {
    unsubscriber?.()
    sheet.detachObject(`${levelId}-elements`)
  })

  $: checkpointCount = objects
    .filter(([_, key]) => {
      if (key.startsWith('Checkpoint')) return true
      return false
    })
    .map((o) => o[2])
    .flat().length

  $: finishCount = objects
    .filter(([_, key]) => {
      if (key.startsWith('Finish')) return true
      return false
    })
    .map((o) => o[2])
    .flat().length
</script>

<slot
  {objects}
  {sheetObject}
  {entities}
  {levelSheetObjects}
  {checkpointCount}
  {finishCount}
/>

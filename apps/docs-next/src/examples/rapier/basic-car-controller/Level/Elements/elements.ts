import type { ISheetObject } from '@theatre/core'
import type { IExtension, IStudio, ToolsetConfig } from '@theatre/studio'
import { currentWritable } from '@threlte/core'
import { useTheatre } from '@threlte/theatre'
import { onDestroy, setContext, tick } from 'svelte'
import { derived } from 'svelte/store'

type ElementConfiguration = {
  component: any
  name: string
  buttonSvgSource: string
}

type ElementConfigurations = ElementConfiguration[]

const delimiter = ','
const parseString = (str: string) => {
  const ids = str.split(',').filter((id) => id !== '')
  return ids
}

const createEntityId = () => {
  return Math.random().toString(16).slice(2)
}

const addEntity = (entitiesString: string, id: string) => {
  const currentEntities = parseString(entitiesString)
  // filter duplicates
  return [...currentEntities, id]
    .filter((id) => id !== '')
    .filter((id, index, array) => array.indexOf(id) === index)
    .join(delimiter)
}

const removeEntity = (entitiesString: string, entityId: string) => {
  const currentEntities = parseString(entitiesString)
  return currentEntities.filter((id) => id !== entityId).join(delimiter)
}

const isISheetObject = (obj: any): obj is ISheetObject => {
  return obj && obj.type === 'Theatre_SheetObject_PublicAPI'
}

const duplicateElement = (
  studio: IStudio,
  entities: Record<string, string>,
  sheetObject: ISheetObject,
  levelSheetObjects: Record<string, ISheetObject>
) => {
  const [currentSelection] = studio.selection
  if (!isISheetObject(currentSelection)) return
  const { objectKey } = currentSelection.address

  const valuesToApply = currentSelection.value

  const elementName = objectKey.split('-')[0]
  if (!elementName) return
  const entitiesValueBefore = entities[elementName]
  // there has to be something selected
  if (!entitiesValueBefore) return

  const newId = createEntityId()
  studio.transaction(({ set }) => {
    if (!sheetObject) return
    set(sheetObject.props, {
      ...sheetObject.value,
      [elementName]: addEntity(entitiesValueBefore, newId)
    })
  })

  let interval: ReturnType<typeof setInterval> | undefined = undefined
  const clear = () => {
    clearInterval(interval)
  }

  // we need to poll here because unsubscribing immediately
  // after subscribing is dangerous
  interval = setInterval(() => {
    const object = levelSheetObjects[`${elementName}-${newId}`]
    if (object) {
      studio.transaction(({ set }) => {
        set(object.props, valuesToApply)
      })
      studio.setSelection([object])
      clear()
    }
  }, 50)
}

export const useLevel = (levelId: string) => {
  const levelSheetObjects = currentWritable<Record<string, ISheetObject>>({})

  setContext<typeof levelSheetObjects>('level-sheet-objects', levelSheetObjects)

  const { defaultProject, studio } = useTheatre()

  // provide the key to the currently selected element
  const selectedId = currentWritable<string | undefined>(undefined)
  const unsubscribe = studio.current?.onSelectionChange((selection) => {
    const firstSelected = selection[0]
    if (!firstSelected || !isISheetObject(firstSelected)) {
      selectedId.set(undefined)
      return
    }
    const sheetObject = firstSelected
    const [elementName, id] = sheetObject.address.objectKey.split('-')
    if (!elementName || !id) {
      selectedId.set(undefined)
      return
    }
    selectedId.set(id)
  })
  onDestroy(() => unsubscribe?.())

  const sheet = defaultProject.current?.sheet(levelId)

  const entities = currentWritable<Record<string, string>>({})

  const elementConfigurations = currentWritable<ElementConfigurations>([])

  const sheetObject = currentWritable<ISheetObject | undefined>(undefined)

  const objects = derived(entities, (entities) => {
    // turn Record<string, string(delimited)> into string[][]
    return Object.entries(entities).map(([key, value]) => {
      const component = elementConfigurations.current.find(
        (element) => element.name === key
      )?.component
      return [component, key, parseString(value)] as [any, string, string[]]
    })
  })

  let unsubscriber: (() => void) | undefined = undefined

  const createObject = () => {
    if (unsubscriber) unsubscriber()

    sheetObject.set(
      sheet?.object(
        `${levelId}-elements`,
        {
          ...entities.current
        },
        {
          reconfigure: true
        }
      ) as any
    )

    unsubscriber = sheetObject.current?.onValuesChange((values) => {
      entities.set(values)
    })
  }

  onDestroy(() => {
    unsubscriber?.()
  })

  const registerElements = (ecs: ElementConfigurations) => {
    elementConfigurations.set(ecs)
    ecs.forEach((element) => {
      entities.update((entities) => {
        entities[element.name] = ''
        return entities
      })
    })
    createObject()
  }

  const getExtensionConfig = (): IExtension => {
    return {
      id: 'elements-extension',
      toolbars: {
        global: ((set, studio) => {
          const addHandler = Object.values(elementConfigurations.current).map((element) => {
            return {
              type: 'Icon',
              title: 'Add Or Replace ' + element.name,
              svgSource: element.buttonSvgSource,
              onClick: () => {
                if (!sheetObject.current) return
                const [currentSelection] = studio.selection
                if (!isISheetObject(currentSelection)) {
                  // add
                  const entitiesValueBefore = entities.current[element.name] ?? ''
                  const newId = createEntityId()
                  const updatedEntities = addEntity(entitiesValueBefore, newId)
                  studio.transaction(({ set }) => {
                    if (!sheetObject.current) return
                    set(sheetObject.current.props, {
                      ...sheetObject.current.value,
                      [element.name]: updatedEntities
                    })
                  })
                } else {
                  // replace
                  // get the object key of the currently selected object
                  const { objectKey } = currentSelection.address

                  // get the values of the currently selected object
                  const valuesToApply = currentSelection.value

                  // the object key contains the object name and the id
                  const [elementName, elementId] = objectKey.split('-')
                  if (!elementName || !elementId || elementName === element.name) return

                  // we have to "delete" the old object, so we need to get all
                  // entities from that objects type
                  const entitiesValueBeforeOfOldElement = entities.current[elementName]
                  // sanity check, there needs to be an associated entity
                  if (!entitiesValueBeforeOfOldElement) return

                  // we also need to "add" the new object, so we need to get all
                  // entities from the new objects type.
                  // Because it's possible that there's no entity yet, we need to
                  // provide a default value.
                  const entitiesValueBeforeOfNewElement = entities.current[element.name] ?? ''

                  const updatedEntitiesRemovedObject = removeEntity(
                    entitiesValueBeforeOfOldElement,
                    elementId
                  )

                  // we'll make a new id
                  const newId = createEntityId()
                  const updatedEntitiesAddedObject = addEntity(
                    entitiesValueBeforeOfNewElement,
                    newId
                  )

                  studio.transaction(({ set }) => {
                    if (!sheetObject.current) return
                    set(sheetObject.current.props, {
                      ...sheetObject.current.value,
                      [elementName]: updatedEntitiesRemovedObject,
                      [element.name]: updatedEntitiesAddedObject
                    })
                  })

                  let interval: ReturnType<typeof setInterval> | undefined = undefined
                  const clear = () => {
                    clearInterval(interval)
                  }

                  // we need to poll here because unsubscribing immediately
                  // after subscribing is dangerous
                  interval = setInterval(() => {
                    const object = levelSheetObjects.current[`${element.name}-${newId}`]
                    console.log(object)

                    if (object) {
                      studio.transaction(({ set }) => {
                        set(object.props, valuesToApply)
                      })
                      studio.setSelection([object])
                      clear()
                    }
                  }, 50)
                }
              }
            }
          })

          const duplicate = {
            type: 'Icon',
            title: 'Duplicate',
            svgSource:
              '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" fill="#fff" viewBox="0 0 256 256"><path d="M184,64H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H184a8,8,0,0,0,8-8V72A8,8,0,0,0,184,64Zm-8,144H48V80H176ZM224,40V184a8,8,0,0,1-16,0V48H72a8,8,0,0,1,0-16H216A8,8,0,0,1,224,40Z"></path></svg>',
            onClick: () => {
              if (!sheetObject.current) return
              duplicateElement(
                studio,
                entities.current,
                sheetObject.current,
                levelSheetObjects.current
              )
            }
          }

          const allHandler = [...addHandler, duplicate] as any
          set(allHandler)
        }) as (set: (config: ToolsetConfig) => void, studio: IStudio) => () => void
      },
      panes: []
    } as IExtension
  }

  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'D' && e.getModifierState('Shift') && studio.current && sheetObject.current) {
      e.preventDefault()
      duplicateElement(
        studio.current,
        entities.current,
        sheetObject.current,
        levelSheetObjects.current
      )
    }
    if (e.key === 'Backspace' && e.getModifierState('Control')) {
      e.preventDefault()
      if (!studio.current) return
      const [currentSelection] = studio.current.selection
      if (!isISheetObject(currentSelection)) return
      const { objectKey } = currentSelection.address
      const [elementName, entityId] = objectKey.split('-')
      if (!elementName || !entityId) return
      const entitiesValueBefore = entities.current[elementName]
      if (!entitiesValueBefore) return
      const newEntitiesValue = removeEntity(entitiesValueBefore, entityId)
      studio.current.transaction(({ set }) => {
        if (!sheetObject.current) return
        set(sheetObject.current.props, {
          ...sheetObject.current.value,
          [elementName]: newEntitiesValue
        })
      })
      studio.current.setSelection([])
    }
  }

  window.addEventListener('keydown', onKeyPress)
  onDestroy(() => {
    window.removeEventListener('keydown', onKeyPress)
  })

  const registerExtension = () => {
    if (!studio.current) return
    studio.current.extend(getExtensionConfig())
  }

  return {
    sheetObject,
    objects,
    registerElements,
    registerExtension,
    selectedId
  }
}

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

type ElementConfigurations = Record<string, ElementConfiguration>

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
  return [...new Set([...currentEntities, id])].join(delimiter)
}

const removeEntity = (entitiesString: string, entityId: string) => {
  const currentEntities = parseString(entitiesString)
  return currentEntities.filter((id) => id !== entityId).join(delimiter)
}

const isISheetObject = (obj: any): obj is ISheetObject => {
  return obj && obj.type === 'Theatre_SheetObject_PublicAPI'
}

export const useLevel = (levelId: string) => {
  const levelSheetObjects = currentWritable<Record<string, ISheetObject>>({})

  setContext<typeof levelSheetObjects>('level-sheet-objects', levelSheetObjects)

  const { defaultProject, studio } = useTheatre()

  const sheet = defaultProject.current?.sheet(levelId)

  const entities = currentWritable<Record<string, string>>({})

  const elementConfigurations = currentWritable<ElementConfigurations>({})

  const sheetObject = currentWritable<ISheetObject | undefined>(undefined)

  const objects = derived(entities, (entities) => {
    // turn Record<string, string(delimited)> into string[][]
    return Object.entries(entities).map(([key, value]) => {
      const component = elementConfigurations.current[key]?.component
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

  const registerElement = (element: ElementConfiguration) => {
    elementConfigurations.update((elements) => {
      elements[element.name] = element
      return elements
    })
    entities.update((entities) => {
      entities[element.name] = ''
      return entities
    })
    createObject()
  }

  const getExtensionConfig = (): IExtension => {
    return {
      id: 'hello-world-extension',
      toolbars: {
        global: ((set, studio) => {
          const addHandler = Object.values(elementConfigurations.current).map((element) => {
            return {
              type: 'Icon',
              title: 'Add ' + element.name,
              svgSource: element.buttonSvgSource,
              onClick: () => {
                if (!sheetObject.current) return
                const entitiesValueBefore = entities.current[element.name]!
                const newId = createEntityId()
                studio.transaction(({ set }) => {
                  if (!sheetObject.current) return
                  set(sheetObject.current.props, {
                    ...sheetObject.current.value,
                    [element.name]: addEntity(entitiesValueBefore, newId)
                  })
                })
              }
            }
          })

          const duplicate = {
            type: 'Icon',
            title: 'Duplicate',
            svgSource:
              '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" fill="#fff" viewBox="0 0 256 256"><path d="M184,64H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H184a8,8,0,0,0,8-8V72A8,8,0,0,0,184,64Zm-8,144H48V80H176ZM224,40V184a8,8,0,0,1-16,0V48H72a8,8,0,0,1,0-16H216A8,8,0,0,1,224,40Z"></path></svg>',
            onClick: async () => {
              const [currentSelection] = studio.selection
              if (!isISheetObject(currentSelection)) return
              const { objectKey } = currentSelection.address

              const valuesToApply = currentSelection.value

              const elementName = objectKey.split('-')[0]
              if (!elementName) return
              const entitiesValueBefore = entities.current[elementName]
              // there has to be something selected
              if (!entitiesValueBefore) return

              console.log(sheetObject.current?.props)

              const newId = createEntityId()
              studio.transaction(({ set }) => {
                if (!sheetObject.current) return
                set(sheetObject.current.props, {
                  ...sheetObject.current.value,
                  [elementName]: addEntity(entitiesValueBefore, newId)
                })
              })

              const unsubscribe = levelSheetObjects.subscribe(async (objects) => {
                const object = objects[`${elementName}-${newId}`]
                if (!object) return
                await tick()
                studio.transaction(({ set }) => {
                  set(object.props, valuesToApply)
                })
                studio.setSelection([object])
                unsubscribe()
              })

              console.log(levelSheetObjects.current[`${elementName}-${newId}`])
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
    registerElement,
    registerExtension
  }
}

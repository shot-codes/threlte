import { createRawEventDispatcher, useThrelte } from '@threlte/core'
import { onDestroy } from 'svelte'
import { get } from 'svelte/store'
import type * as THREE from 'three'
import type {
  ComputeFunction,
  DomEvent,
  EventMap,
  Intersection,
  IntersectionEvent,
  State
} from './types'

const getRawEventDispatcher = (object: THREE.Object3D) => {
  return object.userData._threlte_interactivity_dispatcher as
    | ReturnType<typeof createRawEventDispatcher<EventMap>>
    | undefined
}

function getIntersectionId(event: Intersection) {
  return (event.eventObject || event.object).uuid + '/' + event.index + event.instanceId
}

const DOM_EVENTS = [
  ['click', false],
  ['contextmenu', false],
  ['dblclick', false],
  ['wheel', false],
  ['pointerdown', true],
  ['pointerup', true],
  ['pointerleave', true],
  ['pointermove', true],
  ['pointercancel', true]
] as const

type DomEventName = typeof DOM_EVENTS[number][0]

export const setupInteractivity = (state: State) => {
  const { camera: cameraStore, size: SizeStore, renderer } = useThrelte()

  let camera = get(cameraStore)
  onDestroy(cameraStore.subscribe((value) => (camera = value)))

  let size = get(SizeStore)
  onDestroy(SizeStore.subscribe((value) => (size = value)))

  function calculateDistance(event: DomEvent) {
    const dx = event.offsetX - state.initialClick[0]
    const dy = event.offsetY - state.initialClick[1]
    return Math.round(Math.sqrt(dx * dx + dy * dy))
  }

  function cancelPointer(intersections: Intersection[]) {
    for (const hoveredObj of state.hovered.values()) {
      // When no objects were hit or the the hovered object wasn't found underneath the cursor
      // we call pointerout and delete the object from the hovered elements map
      if (
        !intersections.length ||
        !intersections.find((hit) => {
          return (
            hit.object === hoveredObj.object &&
            hit.index === hoveredObj.index &&
            hit.instanceId === hoveredObj.instanceId
          )
        })
      ) {
        const eventObject = hoveredObj.eventObject
        state.hovered.delete(getIntersectionId(hoveredObj))
        const eventDispatcher = getRawEventDispatcher(eventObject)
        if (eventDispatcher) {
          // Clear out intersects, they are outdated by now
          const data = { ...hoveredObj, intersections }
          eventDispatcher('pointerout', data as IntersectionEvent<PointerEvent>)
          eventDispatcher('pointerleave', data as IntersectionEvent<PointerEvent>)
        }
      }
    }
  }

  const setPointer = (event: DomEvent) => {
    state.pointer.set((event.offsetX / size.width) * 2 - 1, -(event.offsetY / size.height) * 2 + 1)
  }

  const getHits = (): Intersection[] => {
    const duplicates = new Set<string>()

    const intersections: Intersection[] = []

    // setup raycaster
    state.raycaster.setFromCamera(state.pointer, camera)

    const hits = state.interactiveObjects
      .flatMap((obj) => state.raycaster.intersectObject(obj, true))
      // Sort by distance
      .sort((a, b) => a.distance - b.distance)
      // Filter out duplicates
      .filter((item) => {
        const id = getIntersectionId(item as Intersection)
        if (duplicates.has(id)) return false
        duplicates.add(id)
        return true
      })

    // Bubble up the events, find the event source (eventObject)
    for (const hit of hits) {
      let eventObject: THREE.Object3D | null = hit.object
      // Bubble event up
      while (eventObject) {
        if (getRawEventDispatcher(eventObject)) intersections.push({ ...hit, eventObject })
        eventObject = eventObject.parent
      }
    }

    return intersections
  }

  function pointerMissed(event: MouseEvent, objects: THREE.Object3D[]) {
    for (let i = 0; i < objects.length; i++) {
      const eventDispatcher = getRawEventDispatcher(objects[i])
      if (!eventDispatcher) continue
      eventDispatcher('pointermissed', event)
    }
  }

  const getEventHandler = (name: DomEventName): ((event: DomEvent) => void) => {
    // Deal with cancelation
    if (name === 'pointerleave' || name === 'pointercancel') {
      return () => cancelPointer([])
    }

    return (event: DomEvent) => {
      const isPointerMove = name === 'pointermove'
      const isClickEvent = name === 'click' || name === 'contextmenu' || name === 'dblclick'

      setPointer(event)

      const hits = getHits()
      const delta = isClickEvent ? calculateDistance(event) : 0

      // Save initial coordinates on pointer-down
      if (name === 'pointerdown') {
        state.initialClick = [event.offsetX, event.offsetY]
        state.lastPointerDownHits = hits.map((hit) => hit.eventObject)
      }

      // If a click yields no results, pass it back to the user as a miss
      // Missed events have to come first in order to establish user-land side-effect clean up
      if (isClickEvent && !hits.length) {
        if (delta <= 2) {
          pointerMissed(event, state.interactiveObjects)
        }
      }

      // Take care of unhover
      if (isPointerMove) cancelPointer(hits)

      let stopped = false

      dispatchEvents: for (const hit of hits) {
        const intersectionEvent: IntersectionEvent<DomEvent> = {
          stopped,
          ...hit,
          intersections: hits,
          stopPropagation() {
            stopped = true
            intersectionEvent.stopped = true
            if (
              state.hovered.size &&
              Array.from(state.hovered.values()).find((i) => i.eventObject === hit.eventObject)
            ) {
              // Objects cannot flush out higher up objects that have already caught the event
              const higher = hits.slice(0, hits.indexOf(hit))
              cancelPointer([...higher, hit])
            }
          },
          camera,
          delta,
          nativeEvent: event,
          pointer: state.pointer,
          ray: state.raycaster.ray
        }

        const eventDispatcher = getRawEventDispatcher(hit.eventObject)
        if (!eventDispatcher) return

        if (isPointerMove) {
          // Move event ...

          if (
            eventDispatcher.hasEventListener('pointerover') ||
            eventDispatcher.hasEventListener('pointerenter') ||
            eventDispatcher.hasEventListener('pointerout') ||
            eventDispatcher.hasEventListener('pointerleave')
          ) {
            const id = getIntersectionId(intersectionEvent)
            const hoveredItem = state.hovered.get(id)
            if (!hoveredItem) {
              // If the object wasn't previously hovered, book it and call its handler
              state.hovered.set(id, intersectionEvent)
              eventDispatcher('pointerover', intersectionEvent as IntersectionEvent<PointerEvent>)
              eventDispatcher('pointerenter', intersectionEvent as IntersectionEvent<PointerEvent>)
            } else if (hoveredItem.stopped) {
              // If the object was previously hovered and stopped, we shouldn't allow other items to proceed
              intersectionEvent.stopPropagation()
            }
          }

          // Call pointer move
          eventDispatcher('pointermove', intersectionEvent as IntersectionEvent<PointerEvent>)
        } else {
          // All other events

          const hasEventListener = eventDispatcher.hasEventListener(name)

          if (hasEventListener) {
            if (!isClickEvent || state.lastPointerDownHits.includes(hit.eventObject)) {
              // Missed events have to come first
              pointerMissed(
                event,
                state.interactiveObjects.filter(
                  (object) => !state.lastPointerDownHits.includes(object)
                )
              )

              // Call the event
              eventDispatcher(name, intersectionEvent)
            }
          } else {
            // "Real" click event
            if (isClickEvent && state.lastPointerDownHits.includes(hit.eventObject)) {
              pointerMissed(
                event,
                state.interactiveObjects.filter(
                  (object) => !state.lastPointerDownHits.includes(object)
                )
              )
            }
          }
        }

        if (stopped) break dispatchEvents
      }
    }
  }

  const disconnect = () => {
    DOM_EVENTS.forEach(([eventName]) => {
      state.target?.removeEventListener(eventName, getEventHandler(eventName))
    })
    state.target = undefined
  }
  onDestroy(disconnect)

  const connect = (target: HTMLElement) => {
    if (state.target) disconnect()
    state.target = target
    DOM_EVENTS.forEach(([eventName, passive]) => {
      state.target?.addEventListener(eventName, getEventHandler(eventName), { passive })
    })
  }

  if (renderer?.domElement) connect(renderer.domElement)

  return {
    connect,
    disconnect
  }
}

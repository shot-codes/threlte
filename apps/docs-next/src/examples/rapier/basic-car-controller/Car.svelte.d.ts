import type { Events, Props, Slots } from '@threlte/core'
import { SvelteComponentTyped } from 'svelte'
import type { Group } from 'three'

export type CarProps = Props<Group>

export default class Car extends SvelteComponentTyped<
  CarProps,
  Events<Group>,
  Slots<Group> & {
    'wheel-fl': { ref: Group }
    'wheel-fr': { ref: Group }
    'wheel-rl': { ref: Group }
    'wheel-rr': { ref: Group }
  }
> {}

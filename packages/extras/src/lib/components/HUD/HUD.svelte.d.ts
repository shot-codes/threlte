import type { Props, Stage } from '@threlte/core'
import { SvelteComponent } from 'svelte'
import type { Scene, ToneMapping } from 'three'

export type HUDProps = Props<Scene> & {
  /**
   * @default true
   */
  autoRender?: boolean

  /**
   * @default ACESFilmicToneMapping
   */
  toneMapping?: ToneMapping

  /**
   * When to render the HUD. Defaults to after the render stage.
   */
  stage?: Stage
}

export default class HUD extends SvelteComponent<HUDProps> {}

<script lang="ts">
  import { useFrame, useRender, useThrelte } from '@threlte/core'
  import { AudioListener } from '@threlte/extras'
  import Stats from 'stats.js'
  import { tick } from 'svelte'
  import { derived } from 'svelte/store'
  import Env from './Env.svelte'
  import Game from './Game.svelte'
  import IntroAndMenuBackground from './IntroAndMenuBackground.svelte'
  import Menu from './Menu.svelte'
  import { appState } from './stores/app'
  import { useKeyPress } from './useKeyPress'

  const { state, visibility } = appState

  const { renderer } = useThrelte()
  if (renderer) renderer.toneMappingExposure = 0.734

  const stats = new Stats()
  stats.showPanel(1) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)
  stats.dom.style.top = 'unset'
  stats.dom.style.bottom = '0'

  let showPanel: boolean | number = false
  stats.showPanel(showPanel as any)
  useKeyPress('Shift+S', () => {
    if (typeof showPanel === 'boolean') {
      showPanel = 0
    } else {
      showPanel = false
    }
    stats.showPanel(showPanel as any)
  })

  useFrame(
    () => {
      stats.begin()
    },
    {
      order: -Infinity
    }
  )

  useRender(async (ctx) => {
    await tick()
    ctx.renderer?.render(ctx.scene, ctx.camera.current)
    stats.end()
  })

  const masterVolume = derived(visibility, (visibility) => {
    return visibility === 'hidden' ? 0 : 1
  })
</script>

<!-- We're only using global audio, so a global Audio Listener is fine -->
<AudioListener masterVolume={$masterVolume} />

<!-- All scenes use the same environment -->
<Env />

{#if $state === 'intro' || $state === 'menu'}
  <IntroAndMenuBackground />
{/if}

{#if $state === 'menu'}
  <Menu />
{:else if $state === 'game'}
  <Game />
{/if}

<script lang="ts">
  import { useFrame, useRender } from '@threlte/core'
  import { AudioListener } from '@threlte/extras'
  import Stats from 'stats.js'
  import { tick } from 'svelte'
  import Game from './Game.svelte'
  import IntroAndMenuBackground from './IntroAndMenuBackground.svelte'
  import Menu from './Menu.svelte'
  import { appState } from './stores/app'
  import { derived } from 'svelte/store'

  const { state, visibility } = appState

  const stats = new Stats()
  stats.showPanel(1) // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)
  stats.dom.style.top = 'unset'
  stats.dom.style.bottom = '0'

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

{#if $state === 'menu'}
  <IntroAndMenuBackground />
  <Menu />
{:else if $state === 'game'}
  <Game />
{/if}

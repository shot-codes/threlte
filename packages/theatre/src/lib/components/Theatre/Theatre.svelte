<script lang="ts">
  import type { IProject, IProjectConfig } from '@theatre/core'
  import { currentWritable } from '@threlte/core'
  import { setContext } from 'svelte'
  import type { TheatreContext } from '../../types/types'
  import Project from '../Project/Project.svelte'
  import Sheet from '../Sheet/Sheet.svelte'
  import Studio from '../Studio/Studio.svelte'

  export let studio = true
  export let config: IProjectConfig | undefined = undefined

  const theatreContext: TheatreContext = {
    defaultProject: currentWritable(undefined),
    defaultSheet: currentWritable(undefined),
    studio: currentWritable(undefined)
  }

  setContext<TheatreContext>('theatre-context', theatreContext)

  let project: IProject | undefined

  $: theatreContext.defaultProject.set(project)
</script>

{#if studio}
  <Studio />
{/if}

<Project {config} bind:project>
  <Sheet>
    <slot />
  </Sheet>
</Project>

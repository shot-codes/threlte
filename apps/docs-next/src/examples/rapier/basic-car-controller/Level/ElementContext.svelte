<script
  lang="ts"
  context="module"
>
  import { getContext, setContext } from 'svelte'

  type ElementContext = {
    name: string
  }

  export const useElement = () => {
    const context = getContext<ElementContext>('element-context')
    if (!context) {
      throw new Error('No element context found')
    }
    return context
  }
</script>

<script lang="ts">
  export let name: string

  setContext<ElementContext>('element-context', {
    name
  })
</script>

<slot />

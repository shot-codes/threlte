<script lang="ts">
  import type { SceneGraphObjectProperties } from '../types/components'
  import HierarchicalObject from './HierarchicalObject.svelte'

  export let object: SceneGraphObjectProperties['object']
</script>

<HierarchicalObject {object}>
  <slot />
</HierarchicalObject>

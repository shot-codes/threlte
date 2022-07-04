<script lang="ts">
  import { Object3D } from 'three'
  import HierarchicalObject from '../../internal/HierarchicalObject.svelte'

  const object = new Object3D()

  const onAdd = (child: Object3D) => {
    console.log(child)
  }

  const onRemove = (child: Object3D) => {
    console.log(child)
  }
</script>

<HierarchicalObject {object} onChildMount={onAdd} onChildDestroy={onRemove}>
  <slot name="a" />
  <slot name="b" />
</HierarchicalObject>

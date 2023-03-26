<script lang="ts">
  import { T } from '@threlte/core'
  import { Collider } from '@threlte/rapier'
  import Floor from './Floor.svelte'
</script>

<Floor />

<T.Group
  position.x={-15}
  position.y={-4}
  rotation.z={(-10 * Math.PI) / 180}
>
  <Collider
    shape="cuboid"
    args={[5, 5, 5]}
  >
    <T.Mesh>
      <T.BoxGeometry args={[10, 10, 10]} />
      <T.MeshStandardMaterial color="red" />
    </T.Mesh>
  </Collider>
</T.Group>

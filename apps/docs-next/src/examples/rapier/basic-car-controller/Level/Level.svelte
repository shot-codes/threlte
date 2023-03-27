<script lang="ts">
  import { T, useLoader } from '@threlte/core'
  import { Collider } from '@threlte/rapier'
  import { TextureLoader } from 'three'
  import Floor from './Floor.svelte'

  const map = useLoader(TextureLoader).load(
    '/assets/basic-vehicle-controller/prototype-textures/Purple/texture_05.png'
  )
</script>

<Floor />

<T.Group
  position.x={-15}
  position.y={-4}
  rotation.z={(-15 * Math.PI) / 180}
>
  <Collider
    shape="cuboid"
    args={[5, 5, 5]}
  >
    <T.Mesh
      castShadow
      receiveShadow
    >
      <T.BoxGeometry args={[10, 10, 10]} />
      {#if $map}
        <T.MeshStandardMaterial map={$map} />
      {/if}
    </T.Mesh>
  </Collider>
</T.Group>

<T.Group
  position.x={-20}
  position.y={-2}
  rotation.z={(-30 * Math.PI) / 180}
>
  <Collider
    shape="cuboid"
    args={[5, 5, 5]}
  >
    <T.Mesh
      castShadow
      receiveShadow
    >
      <T.BoxGeometry args={[10, 10, 10]} />
      {#if $map}
        <T.MeshStandardMaterial map={$map} />
      {/if}
    </T.Mesh>
  </Collider>
</T.Group>

<T.Group
  position.x={-80}
  position.y={15}
  rotation.z={(-10 * Math.PI) / 180}
>
  <Collider
    shape="cuboid"
    args={[5, 5, 5]}
  >
    <T.Mesh
      castShadow
      receiveShadow
    >
      <T.BoxGeometry args={[10, 10, 10]} />
      {#if $map}
        <T.MeshStandardMaterial map={$map} />
      {/if}
    </T.Mesh>
  </Collider>
</T.Group>

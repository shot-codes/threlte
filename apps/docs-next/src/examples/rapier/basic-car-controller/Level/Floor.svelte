<script lang="ts">
  import { T, useLoader } from '@threlte/core'
  import { Collider } from '@threlte/rapier'
  import { RepeatWrapping, TextureLoader } from 'three'

  const map = useLoader(TextureLoader).load(
    '/assets/basic-vehicle-controller/prototype-textures/Orange/texture_08.png',
    {
      transform(result) {
        result.wrapS = result.wrapT = RepeatWrapping
        result.repeat.set(10, 10)
      }
    }
  )
</script>

<T.Group
  {...$$restProps}
  position.y={-0.5}
>
  <Collider
    shape="cuboid"
    args={[50, 0.5, 50]}
  >
    <T.Mesh>
      <T.BoxGeometry args={[100, 1, 100]} />
      {#if $map}
        <T.MeshStandardMaterial map={$map} />
      {/if}
    </T.Mesh>
  </Collider>
</T.Group>

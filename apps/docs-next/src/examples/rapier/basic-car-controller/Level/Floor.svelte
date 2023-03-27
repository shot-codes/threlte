<script lang="ts">
  import { T, useLoader } from '@threlte/core'
  import { Collider } from '@threlte/rapier'
  import { RepeatWrapping, TextureLoader } from 'three'

  const map = useLoader(TextureLoader).load(
    '/assets/basic-vehicle-controller/prototype-textures/Dark/texture_08.png',
    {
      transform(result) {
        result.wrapS = result.wrapT = RepeatWrapping
        result.repeat.set(40, 40)
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
    args={[200, 0.5, 200]}
  >
    <T.Mesh>
      <T.BoxGeometry args={[400, 1, 400]} />
      {#if $map}
        <T.MeshStandardMaterial map={$map} />
      {/if}
    </T.Mesh>
  </Collider>
</T.Group>

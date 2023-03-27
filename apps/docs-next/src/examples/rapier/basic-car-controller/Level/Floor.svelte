<script lang="ts">
  import { T, useLoader } from '@threlte/core'
  import { Collider } from '@threlte/rapier'
  import { RepeatWrapping, TextureLoader } from 'three'

  const map = useLoader(TextureLoader).load(
    '/assets/basic-vehicle-controller/prototype-textures/Dark/texture_08.png',
    {
      transform(result) {
        result.wrapS = result.wrapT = RepeatWrapping
        result.repeat.set(20, 20)
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
    args={[100, 0.5, 100]}
  >
    <T.Mesh>
      <T.BoxGeometry args={[200, 1, 200]} />
      {#if $map}
        <T.MeshStandardMaterial map={$map} />
      {/if}
    </T.Mesh>
  </Collider>
</T.Group>

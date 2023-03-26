<script lang="ts">
  import { T } from '@threlte/core'
  import { useTexture } from '@threlte/extras'
  import { Collider } from '@threlte/rapier'

  export let color = 'white'

  const map = useTexture(
    '/assets/basic-vehicle-controller/prototype-textures/Orange/texture_08.png'
  )
</script>

{#if $map}
  <T.Group {...$$restProps}>
    <Collider
      shape="cuboid"
      args={[5, 5, 5]}
    >
      <T.Mesh>
        <T.BoxGeometry args={[10, 10, 10]} />
        <T.MeshStandardMaterial
          map={$map}
          {color}
        />
      </T.Mesh>
    </Collider>
  </T.Group>
{/if}

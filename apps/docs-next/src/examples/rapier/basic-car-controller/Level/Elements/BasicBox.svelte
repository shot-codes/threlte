<script
  lang="ts"
  context="module"
>
  const geometry = new BoxGeometry(10, 10, 10)
  const material = new MeshStandardMaterial()
</script>

<script lang="ts">
  import { T } from '@threlte/core'
  import { useTexture } from '@threlte/extras'
  import { Collider } from '@threlte/rapier'
  import { BoxGeometry, MeshStandardMaterial } from 'three'

  // color: 'Dark' | 'Green' | 'Light' | 'Orange' | 'Purple' | 'Red' = 'Dark'
  const map = useTexture(`/assets/basic-vehicle-controller/prototype-textures/Dark/texture_06.png`)

  $: if ($map && !material.map) {
    material.map = $map
    material.needsUpdate = true
  }
</script>

<T.Group>
  <Collider
    shape="cuboid"
    args={[5, 5, 5]}
    type="dynamic"
  >
    <T.Mesh
      receiveShadow
      castShadow
    >
      <T is={geometry} />
      <T is={material} />
    </T.Mesh>
  </Collider>
</T.Group>

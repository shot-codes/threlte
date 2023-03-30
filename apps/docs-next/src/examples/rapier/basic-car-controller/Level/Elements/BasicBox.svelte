<script
  lang="ts"
  context="module"
>
  const geometry = new BoxGeometry(10, 10, 10)
  const material = new MeshStandardMaterial({
    roughness: 0.4
  })
</script>

<script lang="ts">
  import { T } from '@threlte/core'
  import { useTexture } from '@threlte/extras'
  import { Collider } from '@threlte/rapier'
  import { BoxGeometry, MeshStandardMaterial } from 'three'
  import Selection from './Selection.svelte'

  // color: 'Dark' | 'Green' | 'Light' | 'Orange' | 'Purple' | 'Red' = 'Dark'
  const textures = useTexture({
    map: `/assets/basic-vehicle-controller/prototype-textures/Dark/texture_06.png`,
    roughnessMap: `/assets/basic-vehicle-controller/prototype-textures/Dark/texture_06_roughness.png`
  })

  export let selected: boolean = false

  $: if ($textures && !material.map) {
    material.map = $textures.map
    material.roughnessMap = $textures.roughnessMap
    material.needsUpdate = true
  }
</script>

<T.Group position.y={-5}>
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

      {#if selected}
        <Selection />
      {/if}
    </T.Mesh>
  </Collider>
</T.Group>

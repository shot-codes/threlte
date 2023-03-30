<script
  lang="ts"
  context="module"
>
  const geometry = new BoxGeometry(10, 5, 10)
  const material = new MeshStandardMaterial()
</script>

<script lang="ts">
  import { createRawEventDispatcher, T } from '@threlte/core'
  import { useTexture } from '@threlte/extras'
  import { Collider, CollisionGroups } from '@threlte/rapier'
  import { BoxGeometry, MeshStandardMaterial } from 'three'
  import Selection from './Selection.svelte'

  // color: 'Dark' | 'Green' | 'Light' | 'Orange' | 'Purple' | 'Red' = 'Dark'

  const map = useTexture(`/assets/basic-vehicle-controller/prototype-textures/Light/texture_07.png`)

  $: if ($map && !material.map) {
    material.map = $map
    material.needsUpdate = true
  }

  const dispatch = createRawEventDispatcher<{
    finishreached: undefined
  }>()

  export let selected: boolean
</script>

<T.Group position.y={-2.5}>
  <Collider
    shape="cuboid"
    args={[5, 2.5, 5]}
    type="dynamic"
  >
    <T.Mesh
      receiveShadow
      castShadow
    >
      <T is={geometry} />
      <T
        is={material}
        color="#68FF6A"
      />

      {#if selected}
        <Selection />
      {/if}
    </T.Mesh>
  </Collider>

  <T.Group position.y={2.5 + 1.25}>
    <CollisionGroups groups={[3]}>
      <Collider
        type="dynamic"
        shape="cuboid"
        args={[5, 1.25, 5]}
        on:sensorenter={() => {
          dispatch('finishreached')
        }}
        sensor
      />
    </CollisionGroups>
  </T.Group>
</T.Group>

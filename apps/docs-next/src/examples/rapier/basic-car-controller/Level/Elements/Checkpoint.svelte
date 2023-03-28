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

  // color: 'Dark' | 'Green' | 'Light' | 'Orange' | 'Purple' | 'Red' = 'Dark'

  const map = useTexture(
    `/assets/basic-vehicle-controller/prototype-textures/Purple/texture_06.png`
  )

  $: if ($map && !material.map) {
    material.map = $map
    material.needsUpdate = true
  }

  const dispatch = createRawEventDispatcher<{
    checkpointreached: undefined
  }>()
</script>

<T.Group {...$$restProps}>
  <Collider
    type="dynamic"
    shape="cuboid"
    args={[5, 2.5, 5]}
  >
    <T.Mesh
      receiveShadow
      castShadow
    >
      <T is={geometry} />
      <T is={material} />
    </T.Mesh>
  </Collider>

  <T.Group position.y={2.5 + 1.25}>
    <CollisionGroups groups={[3]}>
      <Collider
        type="dynamic"
        shape="cuboid"
        args={[5, 1.25, 5]}
        on:sensorenter={() => {
          dispatch('checkpointreached')
        }}
        sensor
      />
    </CollisionGroups>
  </T.Group>
</T.Group>

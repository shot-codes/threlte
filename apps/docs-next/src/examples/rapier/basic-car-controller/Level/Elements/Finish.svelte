<script
  lang="ts"
  context="module"
>
  const geometry = new BoxGeometry(10, 5, 10)
  const material = new MeshStandardMaterial()

  export const preloadFinish = async () => {
    return useTexture(`/assets/basic-vehicle-controller/prototype-textures/Light/texture_07.png`)
  }
</script>

<script lang="ts">
  import { T } from '@threlte/core'
  import { useTexture } from '@threlte/extras'
  import { Collider, CollisionGroups } from '@threlte/rapier'
  import { BoxGeometry, MeshStandardMaterial } from 'three'
  import { useLevelState } from '../LevelState.svelte'
  import { useRefreshCollider } from '../utils/useRefreshCollider'

  // color: 'Dark' | 'Green' | 'Light' | 'Orange' | 'Purple' | 'Red' = 'Dark'

  const map = useTexture(`/assets/basic-vehicle-controller/prototype-textures/Light/texture_07.png`)

  $: if ($map && !material.map) {
    material.map = $map
    material.needsUpdate = true
  }

  const { registerFinishReached } = useLevelState()

  const { refreshFns } = useRefreshCollider()
</script>

<T.Group position.y={-2.5}>
  <Collider
    shape="cuboid"
    args={[5, 2.5, 5]}
    type="static"
    bind:refresh={refreshFns[0]}
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

      <slot name="selection" />
    </T.Mesh>
  </Collider>

  <T.Group position.y={2.5 + 1.25}>
    <CollisionGroups groups={[3]}>
      <Collider
        type="static"
        shape="cuboid"
        args={[5, 1.25, 5]}
        on:sensorenter={() => {
          registerFinishReached()
        }}
        sensor
        bind:refresh={refreshFns[1]}
      />
    </CollisionGroups>
  </T.Group>
</T.Group>

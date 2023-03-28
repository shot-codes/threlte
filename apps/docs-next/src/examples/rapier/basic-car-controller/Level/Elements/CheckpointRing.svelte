<script
  lang="ts"
  context="module"
>
  const geometry = new TorusGeometry(4.5, 0.5, 24, 48)
  const material = new MeshStandardMaterial()

  const lowPolyGeometry = new TorusGeometry(4.5, 0.5, 4, 12)
</script>

<script lang="ts">
  import type { ISheetObject } from '@theatre/core'

  import { createRawEventDispatcher, T } from '@threlte/core'
  import { useTexture } from '@threlte/extras'
  import { AutoColliders, Collider, CollisionGroups } from '@threlte/rapier'
  import { MeshStandardMaterial, TorusGeometry } from 'three'
  import { useSheetObjectToUpdateAutoColliders } from './useSheetObjectToUpdateAutoColliders'

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

  export let sheetObject: ISheetObject
  const { refresh } = useSheetObjectToUpdateAutoColliders(sheetObject)
</script>

<T.Group {...$$restProps}>
  <AutoColliders
    shape="trimesh"
    bind:refresh={$refresh}
  >
    <T.Mesh visible={false}>
      <T is={lowPolyGeometry} />
    </T.Mesh>
  </AutoColliders>

  <T.Mesh
    receiveShadow
    castShadow
  >
    <T is={geometry} />
    <T is={material} />
  </T.Mesh>

  <T.Group rotation.x={(90 * Math.PI) / 180}>
    <CollisionGroups groups={[3]}>
      <Collider
        type="dynamic"
        shape="cylinder"
        args={[0.5, 4.5]}
        on:sensorenter={() => {
          dispatch('checkpointreached')
        }}
        sensor
      />
    </CollisionGroups>
  </T.Group>
</T.Group>

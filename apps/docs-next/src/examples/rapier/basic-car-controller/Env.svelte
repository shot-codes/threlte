<script
  lang="ts"
  context="module"
>
  import { T, useLoader, useThrelte } from '@threlte/core'
  import { onDestroy } from 'svelte'
  import { Color, EquirectangularReflectionMapping, TextureLoader, sRGBEncoding } from 'three'
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
  import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare'
  import { sunPos } from './config'

  const loadEnv = () => {
    const loader = useLoader(RGBELoader)
    return loader.load(
      '/assets/basic-vehicle-controller/backgrounds/rustig_koppie_puresky_4k.hdr',
      {
        transform(result) {
          result.encoding = sRGBEncoding
          result.mapping = EquirectangularReflectionMapping
          return result
        }
      }
    )
  }

  const loadLensflareTextures = async () => {
    const loader = useLoader(TextureLoader)
    const distances = [0, 0.4, 0.8]
    const sizes = [512, 512, 256]
    const colors = [new Color('#767676'), new Color('#ADADAD'), new Color('#E4E4E4')]
    const textures = await loader.load([
      '/assets/basic-vehicle-controller/lensflare/lensflare0.png',
      '/assets/basic-vehicle-controller/lensflare/lensflare2.png',
      '/assets/basic-vehicle-controller/lensflare/lensflare3.png'
    ])
    return textures.map((texture, index) => {
      return {
        texture,
        size: sizes[index],
        color: colors[index],
        distance: distances[index]
      }
    })
  }

  export const preloadEnv = async () => {
    await Promise.all([loadEnv(), loadLensflareTextures()])
  }
</script>

<script lang="ts">
  const { scene } = useThrelte()

  let previousBackground = scene.background
  let previousEnvironment = scene.environment

  const setEnv = async () => {
    const texture = await loadEnv()
    scene.background = texture
    scene.environment = texture
  }

  setEnv()

  onDestroy(() => {
    scene.background = previousBackground
    scene.environment = previousEnvironment
  })
</script>

<T.Group
  position.x={sunPos[0] * 1000}
  position.y={sunPos[1] * 1000}
  position.z={sunPos[2] * 1000}
>
  {#await loadLensflareTextures() then elements}
    <T
      is={Lensflare}
      let:ref={lensflare}
    >
      {#each elements as element}
        <T
          is={LensflareElement}
          args={[element.texture, element.size, element.distance, element.color]}
          on:create={({ ref }) => {
            lensflare.addElement(ref)
          }}
        />
      {/each}
    </T>
  {/await}
</T.Group>

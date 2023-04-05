<script
  lang="ts"
  context="module"
>
  import { useLoader, useThrelte } from '@threlte/core'
  import { onDestroy } from 'svelte'
  import { EquirectangularReflectionMapping, sRGBEncoding } from 'three'
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'

  const load = () => {
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

  export const preloadEnv = async () => {
    await load()
  }
</script>

<script lang="ts">
  const { scene } = useThrelte()

  let previousBackground = scene.background
  let previousEnvironment = scene.environment

  const setEnv = async () => {
    const texture = await load()
    scene.background = texture
    scene.environment = texture
  }

  setEnv()

  onDestroy(() => {
    scene.background = previousBackground
    scene.environment = previousEnvironment
  })
</script>

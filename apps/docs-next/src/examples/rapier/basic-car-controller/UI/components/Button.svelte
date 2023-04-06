<script lang="ts">
  import { c } from '../../../../../lib/classes'

  let _class = ''
  export { _class as class }
</script>

<button
  on:click
  class={c(
    'px-2 bg-white border-2 border-black text-black hover:bg-black hover:text-white uppercase [&_svg]:h-[1em] [&_svg]:w-[1em] [&_svg]:!fill-current',
    _class
  )}
>
  <slot />
</button>

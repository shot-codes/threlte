<script lang="ts">
  import UiWrapper from './UiWrapper.svelte'

  export let levelId: string
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-full tracking-widest uppercase">
    <div>{levelId}</div>

    <div>PRESS ENTER TO START</div>
  </div>
</UiWrapper>

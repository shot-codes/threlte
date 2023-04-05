<script lang="ts">
  import { getters } from '../stores/getters'
  import UiWrapper from './UiWrapper.svelte'

  const { formattedTime } = getters.timeAttack
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-[33vh] tracking-widest">
    <div>
      {$formattedTime}
    </div>
  </div>
</UiWrapper>

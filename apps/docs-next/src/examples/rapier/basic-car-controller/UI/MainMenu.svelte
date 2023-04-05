<script lang="ts">
  import { actions } from '../stores/app'
  import UiWrapper from './UiWrapper.svelte'
</script>

<UiWrapper>
  <div class="flex flex-col justify-center items-center h-full tracking-widest">
    <div class="">THRELTEMANIA</div>

    <button
      class="bg-white border-2 px-2 py-0 border-black uppercase hover:bg-black hover:text-white"
      on:click={() => {
        actions.goToCampaignMenu()
      }}>Campaign</button
    >
  </div>
</UiWrapper>

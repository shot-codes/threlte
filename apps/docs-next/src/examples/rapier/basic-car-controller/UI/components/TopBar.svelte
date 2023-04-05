<div class="relative w-full top-0">
  <div class="absolute w-full top-0 left-0">
    <div class="absolute left-0 top-0">
      <slot name="left" />
    </div>

    <div class="absolute left-1/2 -translate-x-1/2 top-0">
      <slot name="center" />
    </div>

    <div class="absolute right-0 top-0">
      <slot name="right" />
    </div>
  </div>
</div>

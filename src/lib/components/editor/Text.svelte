<script lang="ts">
    let { value, name, ...rest } = $props();
</script>

<input type="hidden" value={value} name={name} />
<div class="size-full p-1 text-stone-500">
    {value}
</div>

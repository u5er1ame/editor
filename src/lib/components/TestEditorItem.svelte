<script lang="ts">
let { key, value, label, error, comp, hidden, getter, setter, onchange,...rest } = $props();
$inspect(rest);
</script>

<div class="size-full flex flex-col">
    <div class="size-full text-center">
	<div class="text-xl">
	    {key} {value?.name}
	</div>
    </div>
</div>

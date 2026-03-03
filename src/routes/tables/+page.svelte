<script lang="ts">
 import Table from "$lib/components/Table.svelte";
 let { data,...rest } = $props();
</script>

<h1>Db {data.message}</h1>
<Table />

<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';

	let { data, form, ...rest } = $props();
</script>

{#if data?.isAuthenticated}
	<h1>U are authenticated!</h1>
{:else}
	<LoginForm />
{/if}

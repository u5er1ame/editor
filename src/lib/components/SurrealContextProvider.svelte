<script lang="ts">
	import { type LayoutData, type LayoutProps } from '../../routes/$types';
	import { setSurrealContext } from '$lib/client/db.context.svelte';

	let { children, db, ...rest }: { children: LayoutProps['children']; db: LayoutData['db'] } =
		$props();

		const client = setSurrealContext(() => db);
</script>

{@render children?.()}

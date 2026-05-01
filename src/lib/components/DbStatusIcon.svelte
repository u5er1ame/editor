<script lang="ts">
import { getSurrealContext } from '$lib/client/db.context.svelte';

import ChevronDown from '@lucide/svelte/icons/chevron-down';
import Button from './ui/button/button.svelte';
import * as Nav from '$lib/components/ui/navigation-menu/index';
import * as Popover from '$lib/components/ui/popover/index';
import DbMenu from './DbMenu.svelte';
import DbLoader from './DbLoader.svelte';
import { getContext, onMount } from 'svelte';
import type { ViewController } from '$lib/controller/table.svelte';
	import { browser } from '$app/environment';

let { ...rest } = $props();

const db = getSurrealContext();

let controller: ViewController | undefined = $state();

controller = getContext('viewController');

</script>

{#key db?.status}
	<Nav.Item class="mx-4">
		<DbLoader withReconnectButton>
			<Popover.Root>
				<Popover.Trigger>
					<Button variant="outline" class="size-sm cursor-pointer">
						<p>{db?.username}</p>
						<ChevronDown />
					</Button>
				</Popover.Trigger>
				<Popover.Content>
					<DbMenu />
				</Popover.Content>
			</Popover.Root>
		</DbLoader>
	</Nav.Item>
{/key}

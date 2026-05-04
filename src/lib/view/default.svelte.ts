import type { View } from './table.svelte';

export class DefaultView implements View {
	name = 'Tables';
	href = '/';
	options: any[] = [];
	// TODO: should i incapsulate state here or in component?
}

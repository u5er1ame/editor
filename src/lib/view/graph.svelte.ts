import type { View } from './table.svelte';

export class GraphView implements View {
	name = 'Graph';
	href = '/graph';
	options: any[] = [];
}

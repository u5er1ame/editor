import type { View } from '../table.svelte';

export class TableView implements View {
	name = 'Tables Custom';
	href = '/tbl';
	options: any[] = [];
	// TODO: should i incapsulate state here or in component?
}

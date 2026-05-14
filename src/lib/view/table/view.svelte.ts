import type { IApi } from '@svar-ui/svelte-grid';
import type { View } from '../table.svelte';

export class TableView implements View {
	name = 'Tables Custom';
	href = '/tbl';
	api: IApi | null = null;
	setApi(api: IApi) {
		this.api = api;
	}
	// TODO: should i incapsulate state here or in component?
}

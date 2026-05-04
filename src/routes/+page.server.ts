import { jsonify } from 'surrealdb';
import type { Node } from '@xyflow/svelte';
import { fakeElectricRooms, fakeBoards, fakeBreakers } from '$lib/fake_data';
import { toNode } from '$lib/utils';
import type { PageServerData, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request }): Promise<PageServerData> => {
	const table = new URL(request.url).searchParams.get('table');

	const rooms = fakeElectricRooms.map((r) => {
		return toNode(r);
	});
	const boards = fakeBoards.map((r) => {
		return toNode(r, 'room');
	});
	const breakers = fakeBreakers.map((r) => {
		return toNode(r, 'board');
	});
	const test_data: Node[] = new Array().concat(rooms, boards, breakers);
	// TODO: validate
	//
	return { selected_tab: table, nodes: jsonify(test_data), edges: [], error: null };
};

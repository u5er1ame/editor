import { jsonify, Table, type Prettify } from 'surrealdb';
import type { Node } from "@xyflow/svelte";
import { surreal, isConnected } from '$lib/server/surreal';
import type { Breaker } from '$lib/server/schemas';
import { fakeElectricRooms, fakeBoards, fakeBreakers } from '$lib/fake_data';
import { toNode } from '$lib/utils';
import type { PageServerData, PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ params }): Promise<PageServerData> => {
	// const rootTable = new Table("breakers");
	// try {
	// 	const dbReady = await isConnected();
	// }
	// catch (e: any) {
	// 	return { error: e.body.message, nodes: [] };
	// }
	//
	// await surreal.ready;
	// const res = await surreal.select<Prettify<Breaker>>(rootTable);

	const rooms = fakeElectricRooms.map(r=>{
		return toNode(r);
	});
	const boards = fakeBoards.map(r=>{
		return toNode(r, "room");
	});
	const breakers = fakeBreakers.map(r=>{
		return toNode(r, "board");
	});
	const test_data: Node[] = new Array().concat(rooms, boards, breakers);
	// TODO: validate
	//
	return { nodes: jsonify(test_data), edges: [], error: null };
};

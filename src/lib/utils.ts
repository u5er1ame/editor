import type { Node } from "@xyflow/svelte";

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Uuid } from "surrealdb";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export interface SurrealToken {
  iat: number
  nbf: number
  exp: number
  iss: string
  jti?: Uuid
  NS?: string
  DB?: string
  ID?: string
};

export function decodeJWT(token: string): SurrealToken {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(atob(base64));
}
export function getTokenMaxAge(token: string | SurrealToken) {
  if(typeof token === "string") token = decodeJWT(token);
  const exp = Number(token.exp);
  return Number.isFinite(exp)
	  ? Math.max(0, exp - Math.floor(Date.now() / 1000))
	  : 900; // 15 min fallback
}

import { SvelteMap } from 'svelte/reactivity';
import { writable } from 'svelte/store';

export const resizer = writable(new SvelteMap<string, boolean>());


// TODO: create builder for this
// export const Flow: FlowOptions = {
// 	nodeTypes: {
// 		electric_rooms: Rewrite.Room,
// 		boards: Rewrite.Board,
// 		breakers: Rewrite.Breaker,
// 		root_breakers: Rewrite.Breaker,
// 		// INFO: these nodes created by user and not saved in db yet
// 		unsaved_boards: Rewrite.Board,
// 		unsaved_breakers: Rewrite.Breaker,
// 		unsaved_root_breakers: Rewrite.Breaker,
// 	},
// 	tableLayout: {
// 		electric_rooms: [{
// 			id: "name",
// 			header: "Name",
// 			width: 200,
// 			editor: "text",
// 		}],
// 		boards: defaultBoardDescription,
// 		// INFO: these nodes created by user and not saved in db yet
// 		unsaved_boards: [{
// 			id: "name",
// 			header: "Name",
// 			width: 200,
// 			editor: "text",
// 		}],
// 	},
// 	edgeTypes: {
// 		inbound: Edges.Inbound,
// 		outbound: Edges.Outbound,
// 	},
// 	dimensions: {
// 		electric_rooms: roomDimensions,
// 		boards: boardDimensions,
// 		breakers: breakerDimensions,
// 		root_breakers: breakerDimensions,
// 		unsaved_boards: boardDimensions,
// 		unsaved_breakers: breakerDimensions,
// 		unsaved_root_breakers: breakerDimensions,
// 	},
// 	flowOptions: {
// 		electric_rooms: {
// 			connectable: false,
// 			deletable: false,
// 			expandParent: true,
// 			extent: "parent",
// 			ariaLabel: "Room",
// 			zIndex: 1,
// 		},
// 		boards: {
// 			connectable: false,
// 			draggable: true,
// 			expandParent: true,
// 			extent: "parent",
// 			zIndex: 2,
// 		},
// 		breakers: {
// 			connectable: true,
// 			draggable: true,
// 			expandParent: true,
// 			extent: "parent",
// 			zIndex: 9,
// 		},
// 		root_breakers: {
// 			connectable: true,
// 			draggable: false,
// 			expandParent: true,
// 			extent: "parent",
// 			zIndex: 9,
// 		},
// 	},
// 	layoutOptions: {
// 		electric_rooms: {
// 			"elk.algorithm": "rectpacking",
// 			"elk.direction": "DOWN",
// 			"hierarchyHandling": "INCLUDE_CHILDREN"
// 		},
// 		boards: {
// 			"elk.algorithm": "layered",
// 			"elk.direction": "RIGHT",
// 			"hierarchyHandling": "INCLUDE_CHILDREN"
// 		},
// 		breakers: {
// 			"elk.algorithm": "layered",
// 			"hierarchyHandling": "INCLUDE_CHILDREN"
// 		},
// 		root_breakers: {
// 			"elk.algorithm": "layered",
// 			"elk.direction": "DOWN",
// 			"hierarchyHandling": "INCLUDE_CHILDREN"
// 		},
// 	},
// };



export function splitByParent(nodes: Node[]): Record<string, Node[]> {
	const out: Record<string, Node[]> = {};
	for (const node of nodes) {
		if (node.type == undefined) {
			// TODO: throw?
			continue;
		}
		if (out[node.type] == undefined) {
			out[node.type] = [];
		}
		out[node.type].push(node);
	}
	return out;
}

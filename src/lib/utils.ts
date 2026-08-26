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

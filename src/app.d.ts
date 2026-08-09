import type { Surreal, Token } from "surrealdb";

import type { DatabaseInfo, SystemInfo } from '$lib/server/root_db.svelte';
import type { NoderedDiagnostic } from '$lib/nodered.remote';
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: number | string;
			path?: PropertyKey[]
		}
		interface Locals {
			db: {
				instance: Surreal;
				root_instance: Surreal;
				token: Token | null;
				username?: string;
				database?: string;
			}
		}
		interface PageData {
			db: {
				isConnected: boolean;
				isAuth: boolean;
				username?: string;
				namespace?: string;
				database?: string;
			},
			tables: {
				selected_tab: string,
				info: DatabaseInfo["tables"],
				data?: any,
				config?: any,
			},
		}
		interface PageState {
			db?: {
				namespace?: string,
				database?: string,
			},
			table?: {
				selected_tab: string,
			}
		}
		// interface Platform {}
	}
}

export {};

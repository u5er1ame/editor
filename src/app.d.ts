import type { Token } from "surrealdb";

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
				token: Token | null;
				username: string;
				isConnected: boolean;
			}
		}
		interface PageData {
			nodered: {
				diagnostics: NoderedDiagnostic
			},
			db: {
				isConnected: boolean,
				systeminfo: { system: SystemInfo, defaults: { namespace: string, database: string } }
				token: Token | null;
				username: string

			},
			tables: {
				selected_tab: string,
				info: DatabaseInfo["tables"],
				data?: any,
				config?: any,
			},
		}
		interface PageState {
			table?: {
				selected_tab: string,
			}
		}
		// interface Platform {}
	}
}

export {};

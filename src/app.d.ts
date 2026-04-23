import type { Token } from "surrealdb";
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			cause: string;
		}
		interface Locals {
			db: {
				token: Token | null;
				username: string
			}
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

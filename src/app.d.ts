import type { Tokens } from "surrealdb";
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			cause: Error;
		}
		interface Locals {
			db: {
				token: Tokens | null;
				username: string
			}
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

import { getContext } from 'svelte';
import { invalidate } from '$app/navigation';
import { page } from '$app/state';
import { watch } from 'runed';
import { getNamespaceInfo } from '$lib/db.remote';
import type { Roles } from '$lib/server/root_db.svelte';

export const DB_CONTEXT_KEY = 'db';

export type DBPageData = {
	isConnected: boolean;
	username?: string;
	namespace?: string;
	database?: string;
};

/**
 * Browser session state for the selected SurrealDB namespace and database.
 *
 * The class intentionally owns only client session state and database
 * switching. It does not define route UI or database query behavior.
 */
export class DBContext {
	isConnected: boolean = $state(false);
	username: string = $state('default');
	userRoles: Roles[] | undefined = $state();
	namespace: string = $state('');
	database: string = $state('');

	constructor(pageData: () => DBPageData) {
		const data = pageData();
		console.log("db-context", data)
		this.isConnected = data.isConnected;
		if (data.username) this.username = data.username;
		this.namespace = data.namespace ?? '';
		this.database = data.database ?? '';

		watch.pre(
			() => this.username,
			(cur, previous) => {
				if (!cur || cur === previous) return;

				getNamespaceInfo().then((info) => {
					this.userRoles = info?.users.find((user) => user.name === cur)?.roles ?? [];
				});
			}
		);

		watch.pre(
			() => [this.namespace, this.database],
			(current, previous) => {
				const [namespace, database] = current;
				const [previousNamespace, previousDatabase] = previous ?? [];
				if (!namespace || !database) return;
				if (namespace === previousNamespace && database === previousDatabase) return;

				console.log("using",namespace, database)
				this.use(namespace, database);
			}
		);
	}

	async use(namespace: string, database: string) {
		try {
			await fetch('/api/v1/db/use', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ namespace, database })
			});

			await invalidate(page.url.pathname);
		} catch (cause) {
			console.error('Failed to update DB state:', cause);
		}
	}

	getRoleString(): string {
		if (this.userRoles?.includes('OWNER')) return 'Owner';
		if (this.userRoles?.includes('EDITOR')) return 'Editor';
		return 'Viewer';
	}

	isEditor(): boolean {
		return (this.userRoles?.includes('EDITOR') || this.userRoles?.includes('OWNER')) ?? false;
	}
}

export function getDBContext(): DBContext {
	return getContext<DBContext>(DB_CONTEXT_KEY);
}

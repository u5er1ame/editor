import { Surreal } from 'surrealdb';

export const surreal = new Surreal();

export async function isConnected() {
	try {
		const isConnected = await surreal.connect('ws://localhost:8008/rpc', {
			database: 'main',
			namespace: 'main',
			auth: {
				username: 'editor',
				password: 'server'
			}
		});
		return isConnected;
	} catch (e) {
		return false;
	}
}

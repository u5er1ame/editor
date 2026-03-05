import { db } from '$lib/db';

export async function isConnected() {
	try {
		const isConnected = await db.connect('ws://localhost:8008/rpc', {
			database: 'main',
			namespace: 'main',
			authentication: {
				username: 'editor',
				password: 'server'
			}
		});
		return isConnected;
	} catch (e) {
		return false;
	}
}

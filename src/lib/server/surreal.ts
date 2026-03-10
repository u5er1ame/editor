import { db } from '$lib/db';

export async function isConnected() {
	try {
		let isConnected = false;
		db.connect('ws://localhost:8008/rpc', {
			database: 'main',
			namespace: 'main',
			authentication: {
				username: 'editor',
				password: 'server'
			},
			reconnect: {
				enabled: true,
				attempts: 5,
				retryDelay: 1000,
				retryDelayMax: 10000,
				retryDelayMultiplier: 1.5,
				retryDelayJitter: 0.0,
				catch: (error)=>{
					isConnected = false;
					console.error('reconnect error:');
					return true;
				}


			}
			// INFO: await not catching it for some reason surreal sdk v2 still alpha
		}).then(()=>isConnected = true).catch((e)=>{ isConnected = false});
		return isConnected;
	} catch (e) {
		console.log("connectino	error", e);
		return false;
	}
}

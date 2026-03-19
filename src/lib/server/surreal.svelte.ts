import { type ConnectOptions, Surreal, type ConnectionStatus, ConnectionUnavailableError, UnexpectedConnectionError, BoundQuery, Table } from 'surrealdb';

// export async function isConnected() {
// 	try {
// 		let isConnected = false;
// 		db.connect('ws://localhost:8008/rpc', {
// 			database: 'main',
// 			namespace: 'main',
// 			authentication: {
// 				username: 'editor',
// 				password: 'server'
// 			},
// 			reconnect: {
// 				enabled: true,
// 				attempts: 4,
// 				retryDelay: 1000,
// 				retryDelayMax: 10000,
// 				retryDelayMultiplier: 1.2,
// 				retryDelayJitter: 0.0,
// 				catch: (error) => {
// 					isConnected = false;
// 					console.log('reconnect error:', error.message);
// 					return true;
// 				}
//
//
// 			}
// 			// INFO: await not catching it for some reason surreal sdk v2 still alpha
// 		}).then(() => isConnected = true).catch((e) => { console.log("connect err:", e); isConnected = false });
// 		return isConnected;
// 	} catch (e) {
// 		console.log("connectino	error", e);
// 		return false;
// 	}
// }

export class DB {
	private _db: Surreal = new Surreal();
	url: string;
	options: ConnectOptions;
	status: ConnectionStatus = $derived(this._db.status ?? 'disconnected');
	constructor(url: string, options?: ConnectOptions) {
		this.url = url;

		const retries = 4;
		let attempt = $derived(retries);

		this.options = options ?? {
			database: 'main',
			namespace: 'main',
			authentication: {
				username: 'editor',
				password: 'server'
			},
			reconnect: {
				enabled: true,
				attempts: retries,
				retryDelay: 400,
				retryDelayMax: 2000,
				retryDelayMultiplier: 1.1,
				retryDelayJitter: 0.0,
				// catch: (error) => {
				// 	console.log("ERR",error.name);
				// 	if (error instanceof ConnectionUnavailableError || error instanceof UnexpectedConnectionError) {
				// 		if (attempt > 0) {
				// 			console.log("reconnecting", attempt);
				// 			attempt--;
				// 			return true;
				// 		}
				// 		else {
				// 			console.log("CONNECTION ERROR", error.message);
				// 			return false;
				// 		}
				// 	}
				// 	else {}
				// 	console.error("reconnect error:", error.message);
				// 	return false;
				// }


			}
		}
	}

	async connect() {
		try {
			console.log("connecting to", this.url);
			const res = await this._db.connect(this.url, this.options);
			this.status = this._db?.status ?? 'disconnected';
			return res;
		} catch (e) {
			console.error("connect error", e);
			this.status = 'disconnected';
			return false;
		}
	}
	async query(q: BoundQuery) {
		try {
			console.log("Q: ", q.query);
			if (this.status == 'disconnected') {
				return [];
			}
			const res = await this._db.query(q);
			return res;
		} catch (e) {
			console.error("query error", e);
			return [];
		}
	}
	async select(tbl: Table) {
		try {
			console.log("SEL: ", tbl.name);
			if (this.status == 'disconnected') {
				return [];
			}
			const res = await this._db.select(tbl);
			return res;
		} catch (e) {
			console.error("select error", e);
			return [];
		}
	}
}

export const db = new DB('http://localhost:8008/rpc');

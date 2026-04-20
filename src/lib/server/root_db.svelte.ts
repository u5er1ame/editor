import { env } from "$env/dynamic/private"
import { Surreal, type NamespaceDatabase } from "surrealdb"

export class RootDb {
	url = $state(new URL(env.SURREAL_URL))
	_db = new Surreal()
	isConnected = $state(false)
	loadInfo: any = $state()
	defaults?: NamespaceDatabase = $state()
	constructor() {
	}
	async connect() {
		this.isConnected = await this._db.connect(this.url, {
			authentication: {
				// FIXME: change this!
				username: "viewer",
				password: "viewer",
			}
		}).catch(() => this.isConnected = false);
	}
	async getInfo() {
		/* system: {
	  available_parallelism: 8,
	  cpu_usage: 0,
	  load_average: [Array],
	  memory_allocated: 12780417,
	  memory_usage: 151969792,
	  physical_cores: 4
	} */
		if (!this.isConnected) return
		const [res] = await this._db.query<[{ system: any, defaults: { namespace: string, database: string } }]>("info for root");
		this.loadInfo = res.system
		this.defaults = res.defaults
	}
}

import { env } from "$env/dynamic/private"
import { Surreal, type NamespaceDatabase } from "surrealdb"

type SystemInfo = {
	available_parallelism: number,
	cpu_usage: number,
	load_average: [Array<number>],
	memory_allocated: number,
	memory_usage: number,
	physical_cores: number,
}

export class RootDb {
	url = $state(new URL(env.SURREAL_URL))
	_db = new Surreal()
	isConnected = $state(false)
	loadInfo?: SystemInfo = $state()
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
		if (!this.isConnected) return
		const [res] = await this._db.query<[{ system: SystemInfo, defaults: { namespace: string, database: string } }]>("info for root");
		this.loadInfo = res.system
		this.defaults = res.defaults
	}
}

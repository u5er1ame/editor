import { watch } from "runed";
import { ConnectionUnavailableError, Duration, Surreal, UnexpectedConnectionError, Uuid, type ConnectionStatus, type NamespaceAuth } from "surrealdb";
import { createContext, onMount } from "svelte";

import { toast } from "svelte-sonner";
import { page } from "$app/state";
import type { LayoutData } from "../../routes/$types";

export interface DatabaseInfo {
	accesses: Array<any>
	analyzers: Array<any>
	apis: Array<any>
	buckets: Array<any>
	configs: Array<any>
	functions: Array<any>
	models: Array<any>
	modules: Array<any>
	params: Array<any>
	sequences: Array<any>
	tables: Array<{
		id: number;
		name: string;
		drop: boolean;
		view: boolean;
		kind: { kind: "NORMAL" | "RELATION" };
		schemafull: boolean;
		permissions: Array<{
			create: boolean;
			delete: boolean;
			select: boolean;
			update: boolean;
		}>
	}>
	users: Array<{
		duration: { session: Duration; token: Duration };
		hash: string;
		name: string;
		roles: "OWNER" | "EDITOR" | "VIEWER"[];
	}>
};

export class SurrealStore {
	defaultAuth: NamespaceAuth = {
		namespace: "main",
		username: "user",
		password: "user"
	}
	_db: Surreal = new Surreal();
	status: ConnectionStatus = $state(this._db.status);
	version?: string = $state();
	namespace?: string = $state();
	database?: string = $state();
	url?: URL = $state();
	isAuthenticated: boolean = $state(false);
	username: string = $state(this.defaultAuth.username);
	isConnected: boolean = $state(false);
	reconnectionAtempt: number = $state(1)

	constructor(db: LayoutData["db"]) {
		this.url = db.url;
		this.namespace = db.defaults?.namespace
		this.database = db.defaults?.database
		onMount(() => {
			this.connect().then(()=>{
				this.status = this._db.status; /// INFO: this is necessary for some reason effect stuck on 'connecting'
			});
			return () => {
				this.close()
			}
		});

		this._db.subscribe('error', (err) => {
			console.error('DB ERROR', err);
			toast.error(err.message);
		});


		$effect(() => {
			this.status = this._db.status;
			return () => {
				this._db.close();
			}
		});

		this._db.subscribe('auth', async (token) => {
			if (!token) return
			interface TokenData {
				ID: string;
				NS: string;
				exp: number;
				iat: number;
				iss: string;
				jti: Uuid;
				nbf: number;
			}

			const [tokenData]: [TokenData] = await this._db.query("select * from only $token limit 1")
			console.log('authenticated as', tokenData.ID);
			this.username = tokenData.ID;
			// TODO: save cookie!
			await fetch('/api/v1/login', {
				method: "POST",
				body: JSON.stringify({ value: token.access, user: tokenData.ID, exp: tokenData.exp }),
				credentials: "include"
			});
			this.isAuthenticated = true;
		});

		this._db.subscribe('connected', async (data) => {
			await this._db.use({ namespace: this.namespace, database: this.database });
			this.isConnected = true;
			this.status = this._db.status;
			this.version = data;
			toast.info('Connected to DB');
		});

		this._db.subscribe("using", async (data) => {
			if (this.isAuthenticated) return
			console.log("using", data)
			if (db.token == null) {
				await this._db.signin(this.defaultAuth);
			}
			else {
				await this._db.authenticate(db.token); // TODO: handle expire
			}
		})

		this._db.subscribe('disconnected', () => {
			this.isConnected = false;
			this.status = this._db.status;
			toast.warning('Disconnected from DB');
		});

		this._db.subscribe('connecting', () => {
			this.status = this._db.status;
			console.log("connecting")
		});
		this._db.subscribe('reconnecting', () => {
			this.status = this._db.status;
		});

		watch(() => [this.namespace, this.database], (cur, prev) => {
			if (this._db.status != 'connected') return;
			if (prev && cur.every((val, idx) => val === prev[idx])) return;
			this._db.use({ namespace: this.namespace, database: this.database });
		});

		watch(() => this.username, (cur, prev) => {
			if (this._db.status != 'connected') return;
		});
	}

	async connect() {
		if (this.isConnected || this.url == undefined) return
		const attempts = 4;
		const connected = await this._db.connect(this.url, {
			// namespace: this.namespace,
			// database: this.database,
			// authentication,
			reconnect: {
				enabled: true,
				attempts,
				retryDelay: 200,
				retryDelayMax: 1000,
				retryDelayMultiplier: 1.1,
				retryDelayJitter: 0.0,
				catch: (error) => {
					console.error(error);
					if (error instanceof ConnectionUnavailableError || error instanceof UnexpectedConnectionError) {
						if (this.reconnectionAtempt < attempts) {
							console.error("reconnecting...", this.reconnectionAtempt);
							this.reconnectionAtempt++;
							return false;
						}
						else {
							console.error("CONNECTION ERROR", error.message);
							this.status = 'disconnected';
							this.reconnectionAtempt = 1;
							this.isConnected = false
							return true;
						}
					}
					else {
						console.error("reconnect error:", error.message);
					}
					this.reconnectionAtempt = 1
					return false;
				}
			}
		}).catch((err) => {
			console.error("UNABLE TO CONNECT TO: ", this.url);
		});

		if (!connected) {
			throw new Error("DB connection error");
		}

	}

	async reconnect() { // TODO: handle errors
		await this.connect();
		// if (this._db.accessToken) {
		// 	await this._db.authenticate(this._db.accessToken);
		// 	return true;
		// }
		// else {
		// 	throw new Error("no access token");
		// }
	}

	async invalidate() {
		await this._db.invalidate();
		// TODO: delete cookie?
	}

	async close() {
		if (this.isConnected) {
			await this.invalidate()
			await this._db.close()
		}
	}

	async signin(auth: Omit<NamespaceAuth, "namespace">): Promise<string | undefined> {
		try {
			const credentials: NamespaceAuth = { ...auth, namespace: this.namespace! };
			await this._db.signin(credentials);
		}
		catch (e: any) {
			console.log("signin error", e.kind);
			return e.message;
		}
	}

	async nsInfo() {
		interface NamespaceInfo {
			accesses: Array<{}>
			databases: Array<{
				id: number;
				name: string;
				comment: string;
			}>
			users: Array<{
				duration: { session: Duration; token: Duration };
				hash: string;
				name: string;
				roles: "OWNER" | "EDITOR" | "VIEWER"[];
			}>
		};
		try {
			const [res] = await this._db.query<NamespaceInfo[]>("info for ns structure");
			return res;
		} catch (e) {
			console.error("nsInfo error", e);
		}
	}
	async dbInfo() {
		try {
			const [res] = await this._db.query<DatabaseInfo[]>("info for db structure");
			return res;
		} catch (e) {
			console.error("dbInfo error", e);
		}
	}
}


const [internalGetSurrealContext, setInternalGetSurrealContext] = createContext<SurrealStore>();

export function getSurrealContext() {
	try {
		const SurrealContext = internalGetSurrealContext();
		return SurrealContext;
	} catch (e: any) {
		// INFO: get throws if set not called yet
		console.error(e.name, e.message);
		return null;
	}
}

export function setSurrealContext(fn: () => LayoutData["db"]) {
	const opts = fn()
	const SurrealContext = new SurrealStore(opts);
	setInternalGetSurrealContext(SurrealContext);
	return SurrealContext;
}

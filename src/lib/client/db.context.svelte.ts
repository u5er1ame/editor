import { goto } from "$app/navigation";
import { redirect } from "@sveltejs/kit";
import { watch } from "runed";
import { ConnectionUnavailableError, NotAllowedError, Surreal, Table, UnexpectedConnectionError, Uuid, type ConnectionStatus, type NamespaceAuth, type NamespaceDatabase, type ProvidedAuth, type Tokens } from "surrealdb";
import { createContext, onMount } from "svelte";
import { toast } from "svelte-sonner";
import type { LayoutData } from "../../routes/$types";
import { browser } from "$app/environment";

class SurrealStore {
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

	constructor(db: LayoutData["db"], fetchFunc: typeof fetch) {
		this.url = db.url;
		this.namespace = db.defaults?.namespace
		this.database = db.defaults?.database
		onMount(() => {
			Promise.resolve().then(() => this.connect())
			this.status = this._db.status; /// INFO: this is necessary for some reason effect stuck on 'connecting'
			return () => {
				this.close()
			}
		});

		this._db.subscribe('error', (err) => {
			console.error('DB ERROR', err);
			toast.error(err.message);
		});

		this._db.subscribe("using", async (data) => {
			console.log("using", data)
			if (this.isAuthenticated) return
			if (db.token == null) {
				await this._db.signin(this.defaultAuth);
			}
			else {
				await this._db.authenticate(db.token); // TODO: handle expire
			}
		})

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
			this.isConnected = true;
			this.status = this._db.status;
			this.version = data;
			toast.info('Connected to DB');
			await this._db.use({ namespace: this.namespace, database: this.database });
		});

		this._db.subscribe('disconnected', () => {
			this.isConnected = false;
			this.status = this._db.status;
			toast.warning('Disconnected from DB');
		});

		watch(() => [this.namespace, this.database], (cur, prev) => {
			if (this._db.status != 'connected') return;
			if (prev && cur.every((val, idx) => val === prev[idx])) return;
			this._db.use({ namespace: this.namespace, database: this.database });
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
					console.log("ERR", error);
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

	async reconnect() {
		if (this._db.accessToken) {
			await this._db.authenticate(this._db.accessToken);
			return true;
		}
		else {
			throw new Error("no access token");
		}
	}

	async invalidate() {
		await this._db.invalidate();
	}

	async close() {
		if (this.isConnected) {
			await this.invalidate()
			await this._db.close()
		}
	}

	async nsInfo() {
		try {
			const res = await this._db.query("info for ns");
			const { databases } = res[0];
			return { databases: Object.keys(databases) };
		} catch (e) {
			console.error("nsInfo error", e);
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

export function setSurrealContext(fn: () => LayoutData["db"], fetchFunc: typeof fetch) {
	const opts = fn()
	const SurrealContext = new SurrealStore(opts, fetchFunc);
	setInternalGetSurrealContext(SurrealContext);
	return SurrealContext;
}

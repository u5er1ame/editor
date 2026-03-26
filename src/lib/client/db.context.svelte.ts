import { goto } from "$app/navigation";
import { redirect } from "@sveltejs/kit";
import { watch } from "runed";
import { ConnectionUnavailableError, NotAllowedError, Surreal, UnexpectedConnectionError, type ConnectionStatus, type Tokens } from "surrealdb";
import { createContext, onMount } from "svelte";
import { toast } from "svelte-sonner";

class SurrealStore {
	private _db: Surreal = new Surreal();
	user: Promise<any> = $derived.by(async () => await this._db.auth());
	namespace: string = $state("main");
	database: string = $state("main");
	status: ConnectionStatus = $derived(this._db.status);
	ready: Promise<void> = $derived.by(async () => await this._db.ready);
	url: string = $state("");
	constructor(url: string, token: Tokens) {
		this.url = url;
		onMount(async () => {
			const attempts = 4;
			let attempt = 1
			const connected = await this._db.connect(url, {
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
							if (attempt < attempts) {
								console.error("reconnecting", attempt);
								attempt++;
								return false;
							}
							else {
								console.error("CONNECTION ERROR", error.message);
								this.status = 'disconnected';
								return true;
							}
						}
						else {
						}
						console.error("reconnect error:", error.message);
						return false;
					}
				}
			}).catch((err) => {
				console.log("UNABLE TO CONNECT TO: ", this.url);
			});

			if (!connected) {
				throw new Error("DB connection error");
			}

			const authenticated = await this._db.authenticate(token).catch((e) => {
				if (e instanceof NotAllowedError) {
					if (e.isInvalidAuth) {
						toast.error(e.message);
					}
					if (e.isTokenExpired) {
						toast.warning(e.message);
						fetch("/api/v1/logout").then(() => {
							this.status = 'disconnected';
							goto("/login", { invalidateAll: true });
							window.location.reload();
						});
					}
				}
				console.log("auth error");
			});

			this.status = this._db.status; /// INFO: this is necessary for some reason effect stuck on 'connecting'

		});
		this._db.subscribe("error", (err) => {
			console.log("DB ERROR");
		});
		$effect(() => {
			this.status = this._db.status;
			return () => {
				this._db.close();
			}
		});
		watch(() => [this.namespace, this.database], (cur, prev) => {
			if (this._db.status != 'connected') return;
			this._db.use({ namespace: this.namespace, database: this.database });
		});
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

	async rootInfo() {
		try {
			const res = await this._db.query("info for root");
			const { namespaces, system } = res[0];
			return { namespaces: Object.keys(namespaces), system };
		} catch (e) {
			console.error("rootInfo error", e);
		}
	}
	async nsInfo() {
		try {
			await this._db.use({ namespace: this.namespace });
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

export function setSurrealContext(url: string, token: Tokens) {
	const SurrealContext = new SurrealStore(url, token);
	setInternalGetSurrealContext(SurrealContext);
	return SurrealContext;
}

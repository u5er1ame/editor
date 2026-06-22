import { Duration, Surreal, type NamespaceDatabase } from "surrealdb"

export interface SystemInfo  {
	available_parallelism: number;
	cpu_usage: number;
	load_average: [Array<number>];
	memory_allocated: number;
	memory_usage: number;
	physical_cores: number;
}

export interface NamespaceInfo {
	accesses: Array<any>
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

export const root_access = new Surreal();

export const db = new Surreal();

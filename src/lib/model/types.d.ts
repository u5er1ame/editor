
export type Views = "table" | "graph" | "map";

export type BaseConfig = {
	id: string,
	label: string,
	views?: Views[],
};

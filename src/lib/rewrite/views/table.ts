import { z, type ZodType } from "zod/v4";
import { type IColumnConfig } from "@svar-ui/svelte-grid";

export class TableViewConfig {
    name = "table";
    registry = z.registry<IColumnConfig[]>();
    constructor() {
    }
}

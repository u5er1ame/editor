import { z } from "zod/v4";

export interface View {
    name: string;
    href: string;
}

export interface ViewConfig<T = View["href"]> {
    [key: string]: any;
}

export abstract class ViewConfigForSchema<T = View["href"]> {
    registry = z.registry<ViewConfig<T>>();
    constructor() {
    }
}

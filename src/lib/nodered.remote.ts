import { query } from "$app/server";
import { env } from "$env/dynamic/private";
import z from "zod/v4";

const NoderedDiagnostic = z.object({
	nodejs: z.object({
		version: z.string(),
		platform: z.string(),
		memoryUsage: z.object({
			rss: z.number(),
		}),
	}),
	os: z.object({
		uptime: z.number(),
		loadavg: z.array(z.number()),
		freemem: z.number(),
		totalmem: z.number(),
	}),
	runtime: z.object({
		isStarted: z.boolean(),
		version: z.string(),
	}),
	time: z.object({
		local: z.string(),
	})
});

export const getDiagnostics = query(async () => {
	const data: z.infer<typeof NoderedDiagnostic> = await fetch(env.NODERED_URL + "/diagnostics").then((r) => r.json()).catch(()=>{});
	if (!data) return;
	const result = NoderedDiagnostic.safeParse(data);
	if (!result.success) return;
	return result.data;
});

import { toast } from "svelte-sonner";

export const handleError = (e: ErrorEvent) => {
	toast.error(e.message);
	return e
};
